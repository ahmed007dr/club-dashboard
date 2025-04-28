from django.db import models

# Create your models here.
from django.db.models.signals import post_save
from django.dispatch import receiver
from finance.models import Income, IncomeSource
from django.utils.timezone import now
from accounts.models import User
from members.models import Member
from subscriptions.models import Subscription


class Receipt(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    member = models.ForeignKey('members.Member', on_delete=models.CASCADE)
    subscription = models.ForeignKey('subscriptions.Subscription', on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50, choices=[('cash', 'Cash'), ('visa', 'Visa'), ('bank', 'Bank Transfer')])
    note = models.TextField(blank=True, null=True)
    issued_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    invoice_number = models.CharField(max_length=100, blank=True, null=True, unique=True)

    def __str__(self):
        return f"Receipt #{self.id} - {self.amount} EGP"

class AutoCorrectionLog(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    old_subscription = models.ForeignKey(Subscription, null=True, blank=True, on_delete=models.SET_NULL, related_name='corrected_from')
    new_subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='corrected_to')
    created_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Correction for {self.member.name} on {self.created_at.strftime('%Y-%m-%d')}"



@receiver(post_save, sender=Receipt)
def create_income_for_receipt(sender, instance, created, **kwargs):
    if created:
        source_name = 'Subscription Payment' if instance.subscription else 'General Payment'
        source, _ = IncomeSource.objects.get_or_create(club=instance.club, name=source_name)

        Income.objects.create(
            club=instance.club,
            source=source,
            amount=instance.amount,
            date=instance.date.date(),
            received_by=instance.issued_by,
            related_receipt=instance
        )

        if not instance.invoice_number:
            today_str = now().strftime('%Y%m%d')
            invoice_id = f"INV{today_str}-{instance.id:04d}"
            Receipt.objects.filter(id=instance.id).update(invoice_number=invoice_id)

