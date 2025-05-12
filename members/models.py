from django.db import models
from audit_trail.models import TimeStampedModel
from utils.generate_membership_number import generate_membership_number
from django.contrib.auth import get_user_model
User = get_user_model()

class Member(TimeStampedModel):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE, related_name='members')
    name = models.CharField(max_length=255)
    membership_number = models.CharField(max_length=50, unique=True)
    rfid_code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    national_id = models.CharField(max_length=14, blank=True, null=True)
    birth_date = models.DateField()
    phone = models.CharField(max_length=20)
    phone2 = models.CharField(max_length=20, blank=True, null=True)
    photo = models.ImageField(upload_to='member_photos/', blank=True, null=True)
    job = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=100, blank=True, null=True)
    note = models.CharField(max_length=100, blank=True, null=True)
    referred_by = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='referrals')

    def save(self, *args, **kwargs):
        if not self.membership_number:
            self.membership_number = generate_membership_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['membership_number']),
            models.Index(fields=['rfid_code']),
            models.Index(fields=['phone']),
            models.Index(fields=['national_id']),
            models.Index(fields=['name']),
            models.Index(fields=['club', 'created_at']),
        ]