from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from core.models import Club

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
    phone_number = models.CharField(max_length=15, null=True, blank=True, help_text="User's phone number")
    notes = models.TextField(null=True, blank=True, help_text="Additional notes about the user")
    card_number = models.CharField(max_length=50, null=True, blank=True, help_text="User's card number")
    address = models.TextField(null=True, blank=True, help_text="User's address")
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

    def save(self, *args, **kwargs):
        # Only require password for owner, admin, and reception roles
        if self.role in ['accountant', 'coach']:
            self.set_unusable_password()  # Set unusable password for non-login roles
        super().save(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=['rfid_code']),
            models.Index(fields=['club']),
            models.Index(fields=['role']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['card_number']),
        ]