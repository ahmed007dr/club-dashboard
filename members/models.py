from django.db import models
from utils.generate_membership_number import generate_membership_number

class Member(models.Model):
    GENDER_CHOICES = (
        ('M', 'ذكر'),
        ('F', 'أنثى'),
    )
    
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    membership_number = models.CharField(max_length=50, unique=True)
    rfid_code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    national_id = models.CharField(max_length=14)
    birth_date = models.DateField()
    phone = models.CharField(max_length=20)
    phone2 = models.CharField(max_length=20, blank=True, null=True)
    photo = models.ImageField(upload_to='member_photos/', blank=True, null=True)
    job = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=100, blank=True, null=True)
    note = models.CharField(max_length=100, blank=True, null=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)  
    created_at = models.DateTimeField(auto_now_add=True)
    referred_by = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='referrals')

    def save(self, *args, **kwargs):
        if not self.membership_number:
            self.membership_number = generate_membership_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['membership_number']),
            models.Index(fields=['rfid_code']),
            models.Index(fields=['created_at']),
            models.Index(fields=['gender']),  
        ]