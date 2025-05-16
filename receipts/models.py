from django.db import models
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

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['member']),
            models.Index(fields=['subscription']),
            models.Index(fields=['date']),
            models.Index(fields=['invoice_number']),
        ]

class AutoCorrectionLog(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    old_subscription = models.ForeignKey(Subscription, null=True, blank=True, on_delete=models.SET_NULL, related_name='corrected_from')
    new_subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='corrected_to')
    created_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Correction for {self.member.name} on {self.created_at.strftime('%Y-%m-%d')}"

    class Meta:
        indexes = [
            models.Index(fields=['member']),
            models.Index(fields=['created_at']),
            models.Index(fields=['new_subscription']),
        ]
