from django.db import models

class Ticket(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    buyer_name = models.CharField(max_length=255)
    ticket_type = models.CharField(max_length=50, choices=[('day_pass', 'Day Pass'), ('session', 'Session')])
    price = models.DecimalField(max_digits=10, decimal_places=2)
    used = models.BooleanField(default=False)
    issue_date = models.DateField(auto_now_add=True)
    used_by = models.ForeignKey('members.Member', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.ticket_type} - {self.buyer_name}"

    class Meta:
        indexes = [
            models.Index(fields=['club']),       # For filtering by club
            models.Index(fields=['ticket_type']),# For filtering by ticket type
            models.Index(fields=['used']),       # For filtering used/unused tickets
            models.Index(fields=['issue_date']), # For date-based queries
        ]