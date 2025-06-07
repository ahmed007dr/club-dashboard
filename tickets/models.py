from django.db import models
from django.utils import timezone

class TicketType(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=100) 
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.price} جنيه)"

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['name']),
        ]
        ordering = ['name']

class TicketBook(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    serial_prefix = models.CharField(max_length=20, unique=True)
    issued_date = models.DateField(default=timezone.now)
    total_tickets = models.IntegerField()
    ticket_type = models.ForeignKey(TicketType, on_delete=models.SET_NULL, null=True)  # New field

    def __str__(self):
        ticket_count = Ticket.objects.filter(book=self).count()
        return f"دفتر {self.serial_prefix} ({ticket_count}/{self.total_tickets} تذكرة)"

    def remaining_tickets(self):
        return self.total_tickets - Ticket.objects.filter(book=self).count()

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['serial_prefix']),
        ]

class Ticket(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    ticket_type = models.ForeignKey(TicketType, on_delete=models.SET_NULL, null=True)
    notes = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    issue_datetime = models.DateTimeField(default=timezone.now)
    issued_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='issued_tickets')
    book = models.ForeignKey(TicketBook, on_delete=models.SET_NULL, null=True, blank=True)
    serial_number = models.CharField(max_length=30, unique=True)

    def __str__(self):
        return f"{self.ticket_type.name} - {self.notes} ({self.serial_number})"

    def save(self, *args, **kwargs):
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