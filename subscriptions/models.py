from django.db import models
from datetime import timedelta

# Create your models here.
class SubscriptionType(models.Model):
    name = models.CharField(max_length=100)
    duration_days = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    includes_gym = models.BooleanField(default=False)
    includes_pool = models.BooleanField(default=False)
    includes_classes = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    def save(self, *args, **kwargs):
        if self.start_date and self.type:
            self.end_date = self.start_date + timedelta(days=self.type.duration_days)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Subscription(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    member = models.ForeignKey('members.Member', on_delete=models.CASCADE)
    type = models.ForeignKey(SubscriptionType, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    attendance_days = models.PositiveIntegerField(default=0)
    # receipt = models.OneToOneField('receipts.Receipt', on_delete=models.SET_NULL, null=True, blank=True , related_name='subscription_link')

    def __str__(self):
        return f"{self.member.name} - {self.type.name}"


