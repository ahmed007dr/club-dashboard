from django.contrib import admin
from .models import Attendance, EntryLog

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'subscription', 'get_member_name', 'attendance_date')
    list_filter = ('attendance_date',)
    search_fields = ('subscription__member__name',)

    def get_member_name(self, obj):
        return obj.subscription.member.name
    get_member_name.short_description = 'اسم العضو'


@admin.register(EntryLog)
class EntryLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'member', 'club', 'timestamp', 'approved_by')
    list_filter = ('timestamp', 'club')
    search_fields = ('member__name', 'club__name', 'approved_by__username')
