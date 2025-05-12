from django.db import models
from django.conf import settings
from audit_trail.models import TimeStampedModel
from utils.generate_invoice import generate_invoice_number

class ExpenseCategory(TimeStampedModel):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Expense(TimeStampedModel):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    category = models.ForeignKey('ExpenseCategory', on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    date = models.DateField()
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    invoice_number = models.CharField(max_length=100, blank=True, null=True)
    attachment = models.FileField(upload_to='expenses/', null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = generate_invoice_number(invoice_date=self.date)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.category.name if self.category else 'No Category'} - {self.amount}"

class IncomeSource(TimeStampedModel):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Income(TimeStampedModel):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    source = models.ForeignKey('IncomeSource', on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    date = models.DateField()
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    related_receipt = models.ForeignKey('receipts.Receipt', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.source.name if self.source else 'No Source'} - {self.amount}"