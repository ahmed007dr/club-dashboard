from django.db import models
from datetime import timedelta
from core.models import Club
from django.core.exceptions import ValidationError

class SubscriptionType(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='subscription_types')
    name = models.CharField(max_length=100)
    duration_days = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    includes_gym = models.BooleanField(default=False)
    includes_pool = models.BooleanField(default=False)
    includes_classes = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    max_entries = models.PositiveIntegerField(default=0, help_text="Maximum allowed entries during subscription period (0 means unlimited)")
    is_private = models.BooleanField(default=False, help_text="Is this a private coaching subscription?")
    private_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Additional fee for private coaching")

    def __str__(self):
        return f"{self.name} ({self.club.name}) {'- Private' if self.is_private else ''}"

    class Meta:
        unique_together = ['club', 'name']
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]

class Subscription(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    member = models.ForeignKey('members.Member', on_delete=models.CASCADE)
    type = models.ForeignKey(SubscriptionType, on_delete=models.CASCADE)
    coach = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='private_subscriptions', limit_choices_to={'role': 'coach'}
    )
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    entry_count = models.PositiveIntegerField(default=0, help_text="Number of entries used")

    def clean(self):
        if self.type.is_private and not self.coach:
            raise ValidationError("Private subscriptions must have a coach assigned.")
        if self.coach and not self.type.is_private:
            raise ValidationError("Non-private subscriptions cannot have a coach assigned.")

    def save(self, *args, **kwargs):
        self.full_clean()
        if self.start_date and self.type and not self.end_date:
            self.end_date = self.start_date + timedelta(days=self.type.duration_days)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.member.name} - {self.type.name}"

    def can_enter(self):
        if self.type.max_entries == 0:
            return True
        return self.entry_count < self.type.max_entries

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['member']),
            models.Index(fields=['type']),
            models.Index(fields=['start_date']),
            models.Index(fields=['end_date']),
        ]

class PrivateSubscriptionPayment(models.Model):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payment_logs')
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total payment amount")
    coach_share = models.DecimalField(max_digits=10, decimal_places=2, help_text="Coach's share of the payment")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.amount} for {self.subscription} - Coach Share: {self.coach_share}"

    class Meta:
        indexes = [
            models.Index(fields=['subscription']),
            models.Index(fields=['club']),
            models.Index(fields=['created_at']),
        ]