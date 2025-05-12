from django.db import models
from audit_trail.models import TimeStampedModel

class Club(TimeStampedModel):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)

    def __str__(self):
        return self.name