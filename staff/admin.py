from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources, fields
from .models import Shift, StaffAttendance

# =======================
# Shift Resource & Admin
# =======================

class ShiftResource(resources.ModelResource):
    club_name = fields.Field(column_name='Club')
    staff_username = fields.Field(column_name='Staff')
    approved_by_username = fields.Field(column_name='Approved By')

    def dehydrate_club_name(self, obj):
        return obj.club.name if obj.club else ''

    def dehydrate_staff_username(self, obj):
        return obj.staff.username if obj.staff else ''

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
            'staff_username',
            'approved_by_username',
        )
        export_order = fields


@admin.register(Shift)
class ShiftAdmin(ImportExportModelAdmin):
    resource_class = ShiftResource
    list_display = ('staff', 'club', 'date', 'shift_start', 'shift_end', 'approved_by')
    list_filter = ('club', 'date')
    search_fields = ('staff__username', 'club__name')
    raw_id_fields = ('staff', 'approved_by', 'club')
    date_hierarchy = 'date'
    ordering = ['-date']


# =============================
# Staff Attendance Resource
# =============================

class StaffAttendanceResource(resources.ModelResource):
    club_name = fields.Field(column_name='Club')
    staff_username = fields.Field(column_name='Staff')
    shift_id_display = fields.Field(column_name='Shift ID')
    duration = fields.Field(column_name='Duration (hrs)')

    def dehydrate_club_name(self, obj):
        return obj.club.name if obj.club else ''

    def dehydrate_staff_username(self, obj):
        return obj.staff.username if obj.staff else ''

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
            'staff_username',
            'shift_id_display',
            'duration',
        )
        export_order = fields


@admin.register(StaffAttendance)
class StaffAttendanceAdmin(ImportExportModelAdmin):
    resource_class = StaffAttendanceResource
    list_display = ('staff', 'club', 'check_in', 'check_out', 'shift', 'duration_hours')
    list_filter = ('club', 'check_in', 'check_out')
    search_fields = ('staff__username', 'club__name')
    raw_id_fields = ('staff', 'club', 'shift')
    date_hierarchy = 'check_in'
    ordering = ['-check_in']
