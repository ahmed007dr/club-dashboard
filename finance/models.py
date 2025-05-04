from django.db import models
from accounts.models import User
from utils.generate_invoice import generate_invoice_number

# Create your models here.
class ExpenseCategory(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Expense(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    category = models.ForeignKey('ExpenseCategory', on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    date = models.DateField()
    paid_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    invoice_number = models.CharField(max_length=100, blank=True, null=True)
    attachment = models.FileField(upload_to='expenses/', null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = generate_invoice_number(invoice_date=self.date)
        super(Expense, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.category.name} - {self.amount}"

class IncomeSource(models.Model):
    Renewal = 'Renewal'
    Subscription = 'Subscription'
    ticket_sales = 'ticket_sales'
    SPONSORSHIPS = 'SPONSORSHIPS' 
    EVENTS = 'EVENTS'  

    INCOME_SOURCE_CHOICES = [
        (Renewal, 'Renewal'),
        (Subscription, 'Subscription'),
        (ticket_sales, 'ticket_sales'),
        (SPONSORSHIPS, 'Sponsorships'), 
        (EVENTS, 'Events'), 

    ]
    
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=100, choices=INCOME_SOURCE_CHOICES)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Income(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    source = models.ForeignKey(IncomeSource, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    date = models.DateField()
    received_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    related_receipt = models.ForeignKey('receipts.Receipt', on_delete=models.SET_NULL, null=True, blank=True)
    # ticket = models.OneToOneField('tickets.Ticket', null=True, blank=True, on_delete=models.SET_NULL, related_name='income')

    def __str__(self):
        return f"{self.source.name} - {self.amount}"
