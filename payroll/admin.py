from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from .models import PayrollPeriod, EmployeeContract, CoachPercentage, PayrollDeduction, Payroll
from .serializers import PayrollSerializer

@admin.register(PayrollPeriod)
class PayrollPeriodAdmin(admin.ModelAdmin):
    list_display = ('club', 'start_date', 'end_date', 'is_active', 'created_at', 'payroll_count')
    list_filter = ('club', 'is_active', 'start_date', 'end_date')
    search_fields = ('club__name', 'start_date', 'end_date')
    date_hierarchy = 'start_date'
    list_editable = ('is_active',)
    actions = ['mark_as_active', 'mark_as_inactive']

    def payroll_count(self, obj):
        return obj.payrolls.count()
    payroll_count.short_description = 'Payrolls'

    def mark_as_active(self, request, queryset):
        for period in queryset:
            if period.is_active:
                continue
            period.is_active = True
            period.save()
            self.message_user(request, f"Marked {period} as active", messages.SUCCESS)
    mark_as_active.short_description = "Mark selected periods as active"

    def mark_as_inactive(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, "Marked selected periods as inactive", messages.SUCCESS)
    mark_as_inactive.short_description = "Mark selected periods as inactive"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner' and hasattr(request.user, 'club'):
            return qs.filter(club=request.user.club)
        return qs

@admin.register(EmployeeContract)
class EmployeeContractAdmin(admin.ModelAdmin):
    list_display = ('employee', 'club', 'hourly_rate', 'start_date', 'end_date', 'created_at')
    list_filter = ('club', 'start_date')
    search_fields = ('employee__username', 'club__name')
    date_hierarchy = 'start_date'
    list_select_related = ('employee', 'club')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner' and hasattr(request.user, 'club'):
            return qs.filter(club=request.user.club)
        return qs

@admin.register(CoachPercentage)
class CoachPercentageAdmin(admin.ModelAdmin):
    list_display = ('coach', 'club', 'coach_percentage', 'club_percentage', 'effective_date')
    list_filter = ('club', 'effective_date')
    search_fields = ('coach__username', 'club__name')
    date_hierarchy = 'effective_date'
    list_select_related = ('coach', 'club')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner' and hasattr(request.user, 'club'):
            return qs.filter(club=request.user.club)
        return qs

@admin.register(PayrollDeduction)
class PayrollDeductionAdmin(admin.ModelAdmin):
    list_display = ('payroll', 'amount', 'reason', 'created_at')
    list_filter = ('payroll__club', 'created_at')
    search_fields = ('payroll__employee__username', 'reason')
    date_hierarchy = 'created_at'
    list_select_related = ('payroll', 'payroll__employee', 'payroll__club')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner' and hasattr(request.user, 'club'):
            return qs.filter(payroll__club=request.user.club)
        return qs

class PayrollDeductionInline(admin.TabularInline):
    model = PayrollDeduction
    extra = 1
    can_delete = True
    show_change_link = True


@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = (
        'employee', 'club', 'period', 'total_salary', 'is_finalized',
        'base_salary', 'private_earnings', 'bonuses', 'total_deductions', 'view_details'
    )
    list_filter = ('club', 'period', 'is_finalized', 'employee__role')
    search_fields = ('employee__username', 'club__name', 'period__start_date', 'period__end_date')
    date_hierarchy = 'period__start_date'
    list_select_related = ('employee', 'club', 'period')
    inlines = [PayrollDeductionInline]
    actions = ['finalize_selected_payrolls']
    readonly_fields = (
        'actual_hours', 'absent_hours', 'base_salary', 'absence_deduction',
        'private_earnings', 'total_deductions', 'total_salary'
    )

    def view_details(self, obj):
        url = reverse('admin:payroll_payroll_change', args=[obj.id])
        return format_html('<a href="{}">View Details</a>', url)
    view_details.short_description = 'Details'

    def finalize_selected_payrolls(self, request, queryset):
        for payroll in queryset.filter(is_finalized=False):
            payroll.finalize()
        self.message_user(request, f"تم تهيئة {queryset.count()} سجلات رواتب", messages.SUCCESS)
    finalize_selected_payrolls.short_description = "تهيئة سجلات الرواتب المختارة"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner' and hasattr(request.user, 'club'):
            return qs.filter(club=request.user.club)
        return qs

    def save_model(self, request, obj, form, change):
        if not change:  # عند إنشاء سجل جديد
            super().save_model(request, obj, form, change)  # حفظ الكائن أولاً
            obj.calculate_payroll()  # حساب الرواتب بعد الحفظ
        else:
            super().save_model(request, obj, form, change)

    def save_formset(self, request, form, formset, change):
        if formset.model == PayrollDeduction:
            # حفظ كائن Payroll أولاً للتأكد من وجود PK
            instance = form.save(commit=False)
            instance.calculate_payroll()  # تأكد من إجراء الحسابات
            instance.save()  # حفظ الكائن الأساسي
            form.save_m2m()  # حفظ العلاقات إذا وجدت
            # الآن حفظ السجلات المضمنة
            instances = formset.save(commit=False)
            for instance in instances:
                instance.payroll = form.instance
                instance.save()
            formset.save_m2m()
        else:
            super().save_formset(request, form, formset, change)