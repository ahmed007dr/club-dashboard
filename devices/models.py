from django.db import models
from django.conf import settings
from django.utils.timezone import now
from simple_history.models import HistoricalRecords
from user_visit.models import UserVisit
import uuid

class DeviceSettings(models.Model):
    """
    Stores global settings for device management.
    """
    max_allowed_devices = models.PositiveIntegerField(
        default=6,
        help_text="Maximum number of active devices allowed per user."
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Device Settings"
        verbose_name_plural = "Device Settings"

    def __str__(self):
        return f"Device Settings (Max Devices: {self.max_allowed_devices})"

class AllowedDevice(models.Model):
    """
    Represents an authorized device for a user.
    Tracks device details and activity status.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='allowed_devices'
    )
    device_id = models.CharField(max_length=255, unique=True)  # Unique device fingerprint
    device_type = models.CharField(max_length=50)  # e.g., Mobile, Desktop, Tablet
    device_name = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    device_token = models.UUIDField(default=uuid.uuid4, editable=False)  # Security token for device verification
    
    history = HistoricalRecords()

    class Meta:
        unique_together = ('user', 'device_id')

    def __str__(self):
        return f"{self.user.username} - {self.device_name or self.device_type}"

class ExtendedUserVisit(models.Model):
    """
    Extends UserVisit to track session duration.
    """
    user_visit = models.OneToOneField(UserVisit, on_delete=models.CASCADE)
    session_duration = models.DurationField(null=True, blank=True)

    def __str__(self):
        return f"{self.user_visit.user.username} - {self.session_duration or 'Ongoing'}"
    

class AllowedIP(models.Model):
    ip_address = models.GenericIPAddressField(unique=True)
    description = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.ip_address} ({self.description})"
