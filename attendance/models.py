from django.db import models
from django.utils import timezone
from subscriptions.models import Subscription
from members.models import Member
from core.models import Club

class Attendance(models.Model):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='attendance_attendances')
    attendance_date = models.DateField()  
    entry_time = models.TimeField(default=timezone.now) 
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_attendances')

    def __str__(self):
        return f"{self.subscription.member.name} - {self.attendance_date} {self.entry_time}"

    class Meta:
        indexes = [
            models.Index(fields=['subscription']),
            models.Index(fields=['attendance_date']),
            models.Index(fields=['entry_time']),  
            models.Index(fields=['approved_by']),
        ]

class EntryLog(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='attendance_entry_logs') 
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='attendance_entry_logs')  
    timestamp = models.DateTimeField(default=timezone.now)  
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_approved_entries')  
    related_subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_entry_logs') 

    def __str__(self):
        return f"{self.member.name} entry to {self.club.name} at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

    class Meta:
        indexes = [
            models.Index(fields=['club', 'member']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['related_subscription']),
        ]
