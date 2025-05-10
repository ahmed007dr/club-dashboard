from django.contrib import admin
from django.contrib import messages
from .models import AllowedDevice, ExtendedUserVisit, DeviceSettings ,AllowedIP
import logging

logger = logging.getLogger(__name__)

@admin.register(DeviceSettings)
class DeviceSettingsAdmin(admin.ModelAdmin):
    """
    Admin configuration for DeviceSettings model.
    Allows managing the maximum number of allowed devices.
    """
    list_display = ('max_allowed_devices', 'updated_at')
    readonly_fields = ('updated_at',)

    def has_add_permission(self, request):
        """
        Prevents adding multiple DeviceSettings instances.
        Only one instance is allowed.
        """
        return not DeviceSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        """
        Prevents deleting the DeviceSettings instance.
        """
        return False

@admin.register(AllowedDevice)
class AllowedDeviceAdmin(admin.ModelAdmin):
    """
    Admin configuration for AllowedDevice model.
    Provides device management with custom actions for deactivation.
    """
    list_display = ('user', 'device_name', 'device_type', 'is_active', 'last_seen', 'created_at', 'device_token')
    list_filter = ('is_active', 'device_type')
    search_fields = ('user__username', 'device_id', 'device_name')
    readonly_fields = ('device_id', 'device_token', 'created_at')
    date_hierarchy = 'last_seen'
    
    actions = ['deactivate_devices']

    def deactivate_devices(self, request, queryset):
        """
        Custom action to deactivate selected devices.
        """
        updated = queryset.filter(is_active=True).update(is_active=False)
        for device in queryset:
            logger.info(f"Device deactivated via admin: user={device.user.username}, device_id={device.device_id}")
        self.message_user(
            request,
            f"Successfully deactivated {updated} device(s).",
            messages.SUCCESS
        )
    
    deactivate_devices.short_description = "Deactivate selected devices"

@admin.register(ExtendedUserVisit)
class ExtendedUserVisitAdmin(admin.ModelAdmin):
    """
    Admin configuration for ExtendedUserVisit model.
    Displays session duration and related user visit information.
    """
    list_display = ('user_visit', 'session_duration')
    search_fields = ('user_visit__user__username',)
    readonly_fields = ('user_visit', 'session_duration')


@admin.register(AllowedIP)
class AllowedIPAdmin(admin.ModelAdmin):
    list_display = ['ip_address', 'description']
    search_fields = ['ip_address', 'description']
