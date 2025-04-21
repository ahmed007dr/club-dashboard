from django.db import models
from accounts.models import User

# Create your models here.
class ExpenseCategory(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Expense(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    category = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    date = models.DateField()
    paid_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    invoice_number = models.CharField(max_length=100, blank=True, null=True)
    attachment = models.FileField(upload_to='expenses/', null=True, blank=True)

    def __str__(self):
        return f"{self.category.name} - {self.amount}"

class IncomeSource(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
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

    def __str__(self):
        return f"{self.source.name} - {self.amount}"
