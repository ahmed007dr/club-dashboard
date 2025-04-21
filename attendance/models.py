from django.db import models
from accounts.models import User  

# Create your models here.
class EntryLog(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    member = models.ForeignKey('members.Member', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    related_subscription = models.ForeignKey('subscriptions.Subscription', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.member.name} entered at {self.timestamp}"
