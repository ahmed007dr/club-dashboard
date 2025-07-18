from django.contrib import admin
from django import forms
from django.utils import timezone
from django.shortcuts import render
from django.contrib import messages
from import_export.admin import ImportExportModelAdmin
from import_export import resources, fields
from datetime import date, time, datetime
from dateutil.relativedelta import relativedelta
from .models import Shift, StaffAttendance
from accounts.models import User
from core.models import Club
from employees.models import Employee  # استيراد Employee

# =======================
# Shift Resource
# =======================

class ShiftResource(resources.ModelResource):
    club_name = fields.Field(column_name='Club')
    staff_full_name = fields.Field(column_name='Staff')
    approved_by_username = fields.Field(column_name='Approved By')

    def dehydrate_club_name(self, obj):
        return obj.club.name if obj.club else ''

    def dehydrate_staff_full_name(self, obj):
        return obj.staff.full_name if obj.staff else ''

    def dehydrate_approved_by_username(self, obj):
        return obj.approved_by.username if obj.approved_by else ''

    class Meta:
        model = Shift
        fields = (
            'id',
            'date',
            'shift_start',
            'shift_end',
            'club_name',
            'staff_full_name',
            'approved_by_username',
        )
        export_order = fields

# =======================
# Bulk Shift Form
# =======================

class BulkShiftForm(forms.Form):
    staff = forms.ModelMultipleChoiceField(
        queryset=Employee.objects.all(),  # تغيير لـ Employee
        label="الموظفون",
        widget=forms.CheckboxSelectMultiple,
        required=False
    )
    apply_to_all_staff = forms.BooleanField(
        label="تطبيق على جميع الموظفين في النادي",
        required=False
    )
    start_date = forms.DateField(
        label="تاريخ البداية",
        initial=date.today,
        widget=forms.DateInput(attrs={'type': 'date'})
    )
    end_date = forms.DateField(
        label="تاريخ النهاية",
        widget=forms.DateInput(attrs={'type': 'date'}),
        required=False
    )
    shift_start = forms.TimeField(
        label="وقت البداية",
        initial=time(9, 0),
        widget=forms.TimeInput(attrs={'type': 'time'})
    )
    shift_end = forms.TimeField(
        label="وقت النهاية",
        initial=time(17, 0),
        widget=forms.TimeInput(attrs={'type': 'time'})
    )
    days_of_week = forms.MultipleChoiceField(
        label="أيام الأسبوع",
        choices=[
            ('0', 'الأحد'), ('1', 'الإثنين'), ('2', 'الثلاثاء'),
            ('3', 'الأربعاء'), ('4', 'الخميس'), ('5', 'الجمعة'), ('6', 'السبت')
        ],
        widget=forms.CheckboxSelectMultiple,
        required=False
    )
    action_type = forms.ChoiceField(
        label="نوع الإجراء",
        choices=[
            ('create', 'إنشاء دوامات'),
            ('update', 'تعديل دوامات'),
            ('delete', 'حذف دوامات'),
        ]
    )

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get('start_date')
        end_date = cleaned_data.get('end_date')
        apply_to_all = cleaned_data.get('apply_to_all_staff')
        staff = cleaned_data.get('staff')

        if not apply_to_all and not staff:
            raise forms.ValidationError("يجب اختيار موظف واحد على الأقل أو تفعيل 'تطبيق على جميع الموظفين'.")
        if end_date and end_date < start_date:
            raise forms.ValidationError("تاريخ النهاية يجب أن يكون بعد تاريخ البداية.")
        return cleaned_data

# =======================
# Shift Admin
# =======================

@admin.register(Shift)
class ShiftAdmin(ImportExportModelAdmin):
    resource_class = ShiftResource
    list_display = ('staff', 'club', 'date', 'shift_start', 'shift_end', 'approved_by')
    list_filter = ('club', 'date')
    search_fields = ('staff__full_name', 'club__name')  # تغيير لـ full_name
    raw_id_fields = ('staff', 'approved_by', 'club')
    date_hierarchy = 'date'
    ordering = ['-date']
    actions = ['manage_bulk_shifts']

    def manage_bulk_shifts(self, request, queryset):
        """Custom action to create, update, or delete shifts for selected staff."""
        if 'apply' in request.POST:
            form = BulkShiftForm(request.POST)
            if form.is_valid():
                club = request.user.club
                start_date = form.cleaned_data['start_date']
                end_date = form.cleaned_data['end_date'] or start_date + relativedelta(months=1)
                shift_start = form.cleaned_data['shift_start']
                shift_end = form.cleaned_data['shift_end']
                days_of_week = [int(d) for d in form.cleaned_data['days_of_week']] if form.cleaned_data['days_of_week'] else list(range(7))
                apply_to_all = form.cleaned_data['apply_to_all_staff']
                staff_list = Employee.objects.filter(club=club) if apply_to_all else form.cleaned_data['staff']  # تغيير لـ Employee
                action_type = form.cleaned_data['action_type']

                current_date = start_date
                affected_shifts = 0

                while current_date <= end_date:
                    if current_date.weekday() in days_of_week:
                        for staff in staff_list:
                            if action_type == 'create':
                                if not Shift.objects.filter(staff=staff, date=current_date, club=club).exists():
                                    Shift.objects.create(
                                        club=club,
                                        staff=staff,
                                        date=current_date,
                                        shift_start=shift_start,
                                        shift_end=shift_end,
                                        approved_by=request.user,
                                        shift_end_date=(
                                            current_date if shift_end > shift_start
                                            else current_date + timezone.timedelta(days=1)
                                        )
                                    )
                                    affected_shifts += 1
                            elif action_type == 'update':
                                shifts = Shift.objects.filter(staff=staff, date=current_date, club=club)
                                for shift in shifts:
                                    shift.shift_start = shift_start
                                    shift.shift_end = shift_end
                                    shift.shift_end_date = (
                                        current_date if shift_end > shift_start
                                        else current_date + timezone.timedelta(days=1)
                                    )
                                    shift.approved_by = request.user
                                    shift.save()
                                    affected_shifts += 1
                            elif action_type == 'delete':
                                affected_shifts += Shift.objects.filter(staff=staff, date=current_date, club=club).delete()[0]
                    current_date += timezone.timedelta(days=1)

                action_messages = {
                    'create': f"تم إنشاء {affected_shifts} دوام بنجاح.",
                    'update': f"تم تعديل {affected_shifts} دوام بنجاح.",
                    'delete': f"تم حذف {affected_shifts} دوام بنجاح.",
                }
                self.message_user(request, action_messages[action_type], messages.SUCCESS)
                return None
        else:
            form = BulkShiftForm()

        return render(
            request,
            'admin/bulk_shift_form.html',
            {
                'form': form,
                'title': 'إدارة دوامات الموظفين',
                'action': 'manage_bulk_shifts',
                'queryset': queryset,
            }
        )

    manage_bulk_shifts.short_description = "إنشاء/تعديل/حذف دوامات الموظفين"

# =============================
# Staff Attendance Resource & Admin
# =============================

class StaffAttendanceResource(resources.ModelResource):
    club_name = fields.Field(column_name='Club')
    staff_full_name = fields.Field(column_name='Staff')
    shift_id_display = fields.Field(column_name='Shift ID')
    duration = fields.Field(column_name='Duration (hrs)')

    def dehydrate_club_name(self, obj):
        return obj.club.name if obj.club else ''

    def dehydrate_staff_full_name(self, obj):
        return obj.staff.full_name if obj.staff else ''

    def dehydrate_shift_id_display(self, obj):
        return obj.shift.id if obj.shift else ''

    def dehydrate_duration(self, obj):
        return obj.duration_hours() or "N/A"

    class Meta:
        model = StaffAttendance
        fields = (
            'id',
            'check_in',
            'check_out',
            'club_name',
            'staff_full_name',
            'shift_id_display',
            'duration',
        )
        export_order = fields

@admin.register(StaffAttendance)
class StaffAttendanceAdmin(ImportExportModelAdmin):
    resource_class = StaffAttendanceResource
    list_display = ('staff', 'club', 'check_in', 'check_out', 'shift', 'duration_hours')
    list_filter = ('club', 'check_in', 'check_out')
    search_fields = ('staff__full_name', 'club__name')  # تغيير لـ full_name
    raw_id_fields = ('staff', 'club', 'shift')
    date_hierarchy = 'check_in'
    ordering = ['-check_in']