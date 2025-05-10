# accounts/models.py

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

    rfid_code = models.CharField(max_length=32,unique=True,null=True,blank=True,help_text="RFID tag or card code")

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
