from django.db import models

class Member(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    membership_number = models.CharField(max_length=50, unique=True)
    national_id = models.CharField(max_length=14)
    birth_date = models.DateField()
    phone = models.CharField(max_length=20)
    photo = models.ImageField(upload_to='member_photos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    referred_by = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='referrals')

    def __str__(self):
        return self.name

