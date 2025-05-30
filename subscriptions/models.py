from django.db import models
from datetime import timedelta
from core.models import Club

from django.db import models
from django.utils import timezone
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
    max_freeze_days = models.PositiveIntegerField(default=0, help_text="Maximum allowed freeze days for this subscription type")
    
    def __str__(self):
        return f"{self.name} ({self.club.name})"

    @property
    def subscriptions_count(self):
        """
        Returns the count of active subscriptions for this subscription type.
        Active subscriptions have an end_date >= today.
        """
        return self.subscription_set.filter(end_date__gte=timezone.now().date()).count()

    class Meta:
        unique_together = ['club', 'name']
        indexes = [
            models.Index(fields=['club']),      # For filtering by club
            models.Index(fields=['name']),      # For searching by name
            models.Index(fields=['is_active']), # For filtering active types
            models.Index(fields=['id']),        # For reverse relation queries (e.g., subscription_set)
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
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='created_subscriptions')

    def save(self, *args, **kwargs):
        if self.start_date and self.type and not self.end_date:
            self.end_date = self.start_date + timedelta(days=self.type.duration_days)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.member.name} - {self.type.name}"

    def can_enter(self):
        if self.type.max_entries == 0:  # Unlimited entries
            return True
        return self.entry_count < self.type.max_entries

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['member']),
            models.Index(fields=['type']),
            models.Index(fields=['start_date']),
            models.Index(fields=['end_date']),
            models.Index(fields=['created_by']),
        ]

class FreezeRequest(models.Model):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='freeze_requests')
    requested_days = models.PositiveIntegerField()
    start_date = models.DateField()
    approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.approved and not self.pk:  
            subscription = self.subscription
            total_freeze_days = sum(fr.requested_days for fr in subscription.freeze_requests.filter(approved=True))
            if total_freeze_days + self.requested_days <= subscription.type.max_freeze_days:
                subscription.end_date += timedelta(days=self.requested_days)
                subscription.save()
            else:
                raise ValueError(f"Total freeze days ({total_freeze_days + self.requested_days}) exceeds maximum allowed ({subscription.type.max_freeze_days})")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Freeze for {self.subscription.member.name} - {self.requested_days} days"

    class Meta:
        indexes = [
            models.Index(fields=['subscription']),
            models.Index(fields=['approved']),
            models.Index(fields=['created_at']),
        ]