from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from core.models import Club
from subscriptions.models import Subscription
from members.models import Member
from django.utils import timezone

class User(AbstractUser):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, null=True, blank=True)
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('reception', 'Receptionist'),
        ('accountant', 'Accountant'),
        ('coach', 'Coach'),
    ]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='reception')
    rfid_code = models.CharField(max_length=32, unique=True, null=True, blank=True, help_text="RFID tag or card code")
    groups = models.ManyToManyField(
        Group,
        related_name='custom_user_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='custom_user_permissions_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def __str__(self):
        return self.username

    class Meta:
        indexes = [
            models.Index(fields=['rfid_code']),
            models.Index(fields=['club']),
            models.Index(fields=['role']),
        ]

class Attendance(models.Model):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='attendances')
    attendance_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.subscription.member.name} - {self.attendance_date}"

    class Meta:
        indexes = [
            models.Index(fields=['subscription']),
            models.Index(fields=['attendance_date']),
        ]

class EntryLog(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='entry_logs')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='entry_logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_entries')
    related_subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='entry_logs')

    def __str__(self):
        return f"{self.member.name} entry to {self.club.name} at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

    class Meta:
        indexes = [
            models.Index(fields=['club', 'member']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['related_subscription']),
        ]
