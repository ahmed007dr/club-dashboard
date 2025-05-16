from django.db import models
from accounts.models import User

class FreeInvite(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    guest_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    date = models.DateField()
    status = models.CharField(max_length=50, choices=[('pending', 'Pending'), ('used', 'Used')])
    invited_by = models.ForeignKey('members.Member', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.guest_name

    class Meta:
        indexes = [
            models.Index(fields=['club']),    # For filtering by club
            models.Index(fields=['date']),    # For date-based queries
            models.Index(fields=['status']),  # For filtering by status
        ]