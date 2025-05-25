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
    rfid_code = models.CharField(max_length=32, unique=True, null=False, blank=False, help_text="RFID tag or card code")
    phone = models.CharField(max_length=15, null=True, blank=True, help_text="Phone number")
    birth_date = models.DateField(null=True, blank=True, help_text="Date of birth")
    qualifications = models.TextField(blank=True, help_text="Educational qualifications or certifications")
    groups = models.ManyToManyField(
        Group, related_name='custom_user_set', blank=True,
        help_text='The groups this user belongs to.', verbose_name='groups'
    )
    user_permissions = models.ManyToManyField(
        Permission, related_name='custom_user_permissions_set', blank=True,
        help_text='Specific permissions for this user.', verbose_name='user permissions'
    )

    def __str__(self):
        return self.username or f"{self.first_name} {self.last_name}"

    def clean(self):
        if self.role in ['owner', 'admin', 'reception']:
            if not self.username:
                raise ValidationError("Username is required for owner, admin, and reception roles.")
            if not self.password:
                raise ValidationError("Password is required for owner, admin, and reception roles.")
        else:
            self.is_active = False  # Non-login roles are inactive by default

    class Meta:
        indexes = [
            models.Index(fields=['rfid_code']),
            models.Index(fields=['club']),
            models.Index(fields=['role']),
        ]