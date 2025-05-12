from django.contrib import admin
from .models import AuditLog, UserVisitLog
from django.utils.html import format_html

@admin.register(UserVisitLog)
class UserVisitLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'login_time', 'logout_time', 'ip_address', 'device_info_short', 'duration')
    list_filter = ('user', 'login_time', 'logout_time')
    search_fields = ('user__username', 'ip_address', 'device_info')
    date_hierarchy = 'login_time'
    ordering = ('-login_time',)
    readonly_fields = ('user', 'login_time', 'logout_time', 'ip_address', 'device_info', 'session_key')

    def device_info_short(self, obj):
        """Show truncated device info for better readability."""
        return obj.device_info[:50] + ('...' if len(obj.device_info) > 50 else '')
    device_info_short.short_description = 'Device Info'

    def duration(self, obj):
        """Calculate session duration."""
        if obj.logout_time:
            duration = obj.logout_time - obj.login_time
            seconds = duration.total_seconds()
            if seconds < 60:
                return f"{int(seconds)} seconds"
            elif seconds < 3600:
                return f"{int(seconds // 60)} minutes"
            else:
                return f"{int(seconds // 3600)} hours, {int((seconds % 3600) // 60)} minutes"
        return "Still active"
    duration.short_description = 'Session Duration'

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'user', 'action', 'app_name', 'model_name', 'description_short')
    list_filter = ('action', 'app_name', 'created_at')
    search_fields = ('user__username', 'description', 'app_name', 'model_name')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    readonly_fields = ('action', 'app_name', 'model_name', 'object_id', 'description', 'user', 'created_at')

    def description_short(self, obj):
        """Show truncated description."""
        return obj.description[:50] + ('...' if len(obj.description) > 50 else '')
    description_short.short_description = 'Description'