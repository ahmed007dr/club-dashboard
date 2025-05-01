
# attendance/admin.py
from django.contrib import admin
from .models import Attendance, EntryLog

class AttendanceInline(admin.TabularInline):
    model = Attendance
    extra = 0
    fields = ('attendance_date',)
    readonly_fields = ('attendance_date',)

@admin.register(EntryLog)
class EntryLogAdmin(admin.ModelAdmin):
    list_display = ('member', 'club', 'timestamp', 'approved_by', 'related_subscription')
    list_filter = ('club', 'timestamp')
    search_fields = ('member__name', 'club__name')
    date_hierarchy = 'timestamp'
    raw_id_fields = ('member', 'approved_by', 'related_subscription')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('subscription', 'member_name', 'attendance_date')
    list_filter = ('attendance_date', 'subscription__club')
    search_fields = ('subscription__member__name',)
    date_hierarchy = 'attendance_date'
    raw_id_fields = ('subscription',)
    
    def member_name(self, obj):
        return obj.subscription.member.name
    member_name.short_description = 'Member'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(subscription__club=request.user.club)
        return qs