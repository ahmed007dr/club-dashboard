from django.db import models
from datetime import timedelta
from core.models import Club

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

    def __str__(self):
        return f"{self.name} ({self.club.name})"

    class Meta:
        unique_together = ['club', 'name']
        indexes = [
            models.Index(fields=['club']),    # For filtering by club
            models.Index(fields=['name']),    # For searching by name
            models.Index(fields=['is_active']),  # For filtering active types
        ]

class Subscription(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    member = models.ForeignKey('members.Member', on_delete=models.CASCADE)
    type = models.ForeignKey(SubscriptionType, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    entry_count = models.PositiveIntegerField(default=0, help_text="Number of entries used")

    def save(self, *args, **kwargs):
        if self.start_date and self.type and not self.end_date:
            self.end_date = self.start_date + timedelta(days=self.type.duration_days)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.member.name} - {self.type.name}"

    def can_enter(self):
        """Check if the subscription allows more entries."""
        if self.type.max_entries == 0:  # Unlimited entries
            return True
        return self.entry_count < self.type.max_entries

    class Meta:
        indexes = [
            models.Index(fields=['club']),       # For filtering by club
            models.Index(fields=['member']),     # For filtering by member
            models.Index(fields=['type']),       # For filtering by subscription type
            models.Index(fields=['start_date']), # For filtering active subscriptions
            models.Index(fields=['end_date']),   # For filtering active subscriptions
        ]