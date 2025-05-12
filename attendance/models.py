from django.db import models
from django.utils import timezone
from subscriptions.models import Subscription
from members.models import Member
from core.models import Club
from audit_trail.models import TimeStampedModel
from django.contrib.auth import get_user_model

User = get_user_model()

class Attendance(TimeStampedModel):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='attendances')
    attendance_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.subscription.member.name} - {self.attendance_date}"

class EntryLog(TimeStampedModel):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='entry_logs')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='entry_logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_entries')
    related_subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='entry_logs')

    def __str__(self):
        return f"{self.member.name} entry to {self.club.name} at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"