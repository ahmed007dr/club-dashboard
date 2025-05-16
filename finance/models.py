from django.db import models
from utils.generate_invoice import generate_invoice_number

class ExpenseCategory(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['name']),
        ]
        ordering = ['name']  

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

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['category']),
            models.Index(fields=['date']),
            models.Index(fields=['invoice_number']),
        ]
        ordering = ['-date', 'id'] 

class IncomeSource(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['name']),
        ]
        ordering = ['name'] 

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

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['source']),
            models.Index(fields=['date']),
            models.Index(fields=['related_receipt']),
        ]
        ordering = ['-date', 'id']  