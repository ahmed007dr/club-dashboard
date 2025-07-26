from django.db import models
from django.utils import timezone

class TicketType(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=100) 
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.price} جنيه)"

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['name']),
        ]
        ordering = ['name']

class Ticket(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    ticket_type = models.ForeignKey(TicketType, on_delete=models.SET_NULL, null=True)
    notes = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    issue_datetime = models.DateTimeField(default=timezone.now)
    issued_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='issued_tickets')
    serial_number = models.CharField(max_length=30, unique=True)

    def __str__(self):
        return f"{self.ticket_type.name if self.ticket_type else 'No Type'} - {self.notes} ({self.serial_number})"

    def save(self, *args, **kwargs):
        if not self.serial_number:
            today = timezone.now().date()
            date_prefix = today.strftime('%Y%m%d')
            ticket_count = Ticket.objects.filter(
                club=self.club,
                ticket_type=self.ticket_type,
                issue_datetime__date=today
            ).count()
            if ticket_count >= 999:  
                raise ValueError("Maximum tickets for today reached.")
            serial_number = f"{date_prefix}-{str(ticket_count + 1).zfill(3)}"
            while Ticket.objects.filter(serial_number=serial_number).exists():
                ticket_count += 1
                serial_number = f"{date_prefix}-{str(ticket_count + 1).zfill(3)}"
            self.serial_number = serial_number
        if self.ticket_type and not self.price:
            self.price = self.ticket_type.price
        super().save(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['ticket_type']),
            models.Index(fields=['issue_datetime']),
            models.Index(fields=['serial_number']),
        ]
        ordering = ['-issue_datetime']