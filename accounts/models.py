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
    ]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='reception')
    rfid_code = models.CharField(max_length=32, unique=True, null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    
    can_login = models.BooleanField(default=True)
    
    groups = models.ManyToManyField(
        Group,
        related_name='custom_user_set',
        blank=True,
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='custom_user_permissions_set',
        blank=True,
        verbose_name='user permissions',
    )

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        if not self.can_login:
            self.set_unusable_password()
        super().save(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=['rfid_code']),
            models.Index(fields=['club']),
            models.Index(fields=['role']),
            models.Index(fields=['can_login']),
        ]
