from django.db import models
from accounts.models import User
from django.utils import timezone


class FreeInvite(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    subscription = models.ForeignKey('subscriptions.Subscription', on_delete=models.CASCADE, related_name='free_invites')  
    guest_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    date = models.DateField()
    status = models.CharField(max_length=50, choices=[('pending', 'Pending'), ('used', 'Used')])
    invited_by = models.ForeignKey('members.Member', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_invites')
    

    def __str__(self):
        return self.guest_name

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['date']),
            models.Index(fields=['status']),
            models.Index(fields=['created_by']),
            models.Index(fields=['subscription']),
        ]