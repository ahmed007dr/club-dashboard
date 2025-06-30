from django.db import models
from django.contrib.auth.models import Group
from django.conf import settings

class GroupPermission(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='group_permissions')
    resource = models.CharField(max_length=50)
    can_view = models.BooleanField(default=False)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    shift_restricted = models.BooleanField(default=True)
    allow_old_data_search = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'resource')
        indexes = [models.Index(fields=['group', 'resource'])]

    def __str__(self):
        return f"{self.group.name} - {self.resource}"