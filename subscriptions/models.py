from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from core.models import Club
from django.utils import timezone
from datetime import timedelta

class SubscriptionType(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='subscription_types')
    name = models.CharField(max_length=100)
    duration_days = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    includes_gym = models.BooleanField(default=False)
    includes_pool = models.BooleanField(default=False)
    includes_classes = models.BooleanField(default=False)
    is_private_training = models.BooleanField(default=False, help_text="اشتراك تدريب خاص")
    is_active = models.BooleanField(default=True)
    max_entries = models.PositiveIntegerField(default=0, help_text="Maximum allowed entries during subscription period (0 means unlimited)")
    max_freeze_days = models.PositiveIntegerField(default=0, help_text="Maximum allowed freeze days for this subscription type")

    def __str__(self):
        return f"{self.name} ({self.club.name})"

    @property
    def subscriptions_count(self):
        return self.subscription_set.filter(end_date__gte=timezone.now().date()).count()

    class Meta:
        unique_together = ['club', 'name']
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
            models.Index(fields=['id']),
        ]

class Subscription(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    member = models.ForeignKey('members.Member', on_delete=models.CASCADE)
    type = models.ForeignKey(SubscriptionType, on_delete=models.CASCADE, related_name='subscriptions')

    coach = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, 
                            related_name='private_subscriptions', 
                            limit_choices_to={'role': 'coach', 'is_active': True})
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    private_training_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True,
                                               help_text="سعر التدريب الخاص المخصص لهذا العضو")
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    entry_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='created_subscriptions')

    def save(self, *args, **kwargs):
        if self.start_date and self.type and not self.end_date:
            self.end_date = self.start_date + timedelta(days=self.type.duration_days)
        
        if self.type.is_private_training and self.private_training_price > 0:
            self.remaining_amount = self.private_training_price - self.paid_amount
        else:
            self.remaining_amount = self.type.price - self.paid_amount
        
        super().save(*args, **kwargs)

    def __str__(self):
        coach_str = f" مع الكابتن {self.coach.username}" if self.coach else ""
        return f"{self.member.name} - {self.type.name}{coach_str}"

    def can_enter(self):
        active_freeze = self.freeze_requests.filter(is_active=True, start_date__lte=timezone.now().date()).first()
        if active_freeze:
            return False
        if self.type.max_entries == 0:
            return True
        return self.entry_count < self.type.max_entries

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['member']),
            models.Index(fields=['type']),
            models.Index(fields=['coach']),
            models.Index(fields=['start_date']),
            models.Index(fields=['end_date']),
            models.Index(fields=['created_by']),
        ]

class FreezeRequest(models.Model):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='freeze_requests')
    requested_days = models.PositiveIntegerField()
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='created_freeze_requests')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.start_date and self.requested_days and not self.end_date:
            self.end_date = self.start_date + timedelta(days=self.requested_days)

        if not self.pk:
            subscription = self.subscription
            total_freeze_days = sum(fr.requested_days for fr in subscription.freeze_requests.filter(is_active=False, cancelled_at__isnull=True))
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
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]

class CoachProfile(models.Model):
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, 
                               related_name='coach_profile', 
                               limit_choices_to={'role': 'coach', 'is_active': True})
    max_trainees = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"ملف الكابتن {self.user.username}"

    class Meta:
        indexes = [
            models.Index(fields=['user']),
        ]

@receiver(post_save, sender='accounts.User')
def create_coach_profile(sender, instance, created, **kwargs):
    if created and instance.role == 'coach' and instance.is_active:
        CoachProfile.objects.get_or_create(user=instance, defaults={'max_trainees': 0})

@receiver(post_save, sender='accounts.User')
def update_coach_profile(sender, instance, **kwargs):
    if instance.role == 'coach' and instance.is_active and not hasattr(instance, 'coach_profile'):
        CoachProfile.objects.get_or_create(user=instance, defaults={'max_trainees': 0})
    elif hasattr(instance, 'coach_profile') and (instance.role != 'coach' or not instance.is_active):
        instance.coach_profile.delete()