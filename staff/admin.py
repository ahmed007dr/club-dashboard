from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources, fields
from .models import Shift, StaffAttendance


# =======================
# Shift Resource & Admin
# =======================

class ShiftResource(resources.ModelResource):
    club_name = fields.Field(column_name='Club', attribute='club', readonly=True)
    staff_username = fields.Field(column_name='Staff', attribute='staff', readonly=True)
    approved_by_username = fields.Field(column_name='Approved By', attribute='approved_by', readonly=True)

    class Meta:
        model = Shift
        fields = (
            'id',
            'club__name',
            'staff__username',
            'date',
            'shift_start',
            'shift_end',
            'approved_by__username',
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


# ===========================
# Staff Attendance Resource
# ===========================

class StaffAttendanceResource(resources.ModelResource):
    staff_username = fields.Field(column_name='Staff', attribute='staff', readonly=True)
    club_name = fields.Field(column_name='Club', attribute='club', readonly=True)
    shift_id = fields.Field(column_name='Shift ID', attribute='shift', readonly=True)
    duration = fields.Field(column_name='Duration (hrs)', readonly=True)

    def dehydrate_duration(self, obj):
        return obj.duration_hours() or "N/A"

    class Meta:
        model = StaffAttendance
        fields = (
            'id',
            'staff__username',
            'club__name',
            'check_in',
            'check_out',
            'shift__id',
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
