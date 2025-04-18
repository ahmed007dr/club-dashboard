from django.contrib.auth.models import AbstractUser
from django.db import models

class Club(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# class User(AbstractUser):
#     club = models.ForeignKey(Club, on_delete=models.CASCADE, null=True, blank=True)
#     ROLE_CHOICES = [
#         ('admin', 'Admin'),
#         ('reception', 'Receptionist'),
#         ('accountant', 'Accountant'),
#         ('coach', 'Coach'),
#     ]
#     role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='reception')

#     def __str__(self):
#         return self.username

from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class User(AbstractUser):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE, null=True, blank=True)
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('reception', 'Receptionist'),
        ('accountant', 'Accountant'),
        ('coach', 'Coach'),
    ]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='reception')

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
