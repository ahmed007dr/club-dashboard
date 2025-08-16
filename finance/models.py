from django.db import models
from utils.generate_invoice import generate_invoice_number
from core.models import Club
from django.utils import timezone
from subscriptions.models import PaymentMethod
class ExpenseCategory(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_stock_related = models.BooleanField(default=False)

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
    date = models.DateTimeField(default=timezone.now)
    paid_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='expenses_paid')
    related_employee = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='related_expenses')
    invoice_number = models.CharField(max_length=100, blank=True, null=True)
    attachment = models.FileField(upload_to='expenses/', null=True, blank=True)
    stock_item = models.ForeignKey('StockItem', on_delete=models.SET_NULL, null=True, blank=True)
    stock_quantity = models.PositiveIntegerField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = generate_invoice_number(invoice_date=self.date)
        if self.category and self.category.is_stock_related:
            if self.stock_item and self.stock_quantity:
                StockTransaction.objects.create(
                    stock_item=self.stock_item,
                    transaction_type='ADD',
                    quantity=self.stock_quantity,
                    description=f'شراء عبر المصروف #{self.invoice_number}',
                    related_expense=self,
                    created_by=self.paid_by
                )
            else:
                raise ValueError('يجب تحديد عنصر المخزون والكمية لفئة المصروفات المرتبطة بالمخزون')
        else:
            self.stock_item = None
            self.stock_quantity = None
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.category.name} - {self.amount}"

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['category']),
            models.Index(fields=['date']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['related_employee']),
        ]
        ordering = ['-date', 'id']

class IncomeSource(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock_item = models.ForeignKey('StockItem', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.price} جنيه)"

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['name']),
        ]
        ordering = ['name']


class Income(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    source = models.ForeignKey('IncomeSource', on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    date = models.DateTimeField(default=timezone.now)
    received_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    stock_transaction = models.ForeignKey('StockTransaction', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True, blank=True)
    # payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT) 

    def __str__(self):
        return f"{self.source.name} - {self.amount}"
    
    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['source']),
            models.Index(fields=['date']),
            models.Index(fields=['payment_method']),
        ]
        ordering = ['-date', 'id']


class StockItem(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=50, default='water')
    initial_quantity = models.PositiveIntegerField(default=0)
    current_quantity = models.PositiveIntegerField(default=0)
    is_sellable = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.current_quantity} {self.unit})"

    class Meta:
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['name']),
        ]
        ordering = ['name']

class StockTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('ADD', 'إضافة'),
        ('CONSUME', 'استهلاك'),
    )
    stock_item = models.ForeignKey('StockItem', on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.PositiveIntegerField()
    date = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)
    related_expense = models.ForeignKey('Expense', on_delete=models.SET_NULL, null=True, blank=True)
    related_income = models.ForeignKey('Income', on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_transactions')

    def save(self, *args, **kwargs):
        if self.transaction_type == 'ADD':
            self.stock_item.current_quantity += self.quantity
        elif self.transaction_type == 'CONSUME':
            if self.quantity > self.stock_item.current_quantity:
                raise ValueError('الكمية المستهلكة أكبر من الكمية المتاحة')
            self.stock_item.current_quantity -= self.quantity
        self.stock_item.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.transaction_type} - {self.stock_item.name} ({self.quantity})"

    class Meta:
        indexes = [
            models.Index(fields=['stock_item']),
            models.Index(fields=['date']),
            models.Index(fields=['created_by']),
        ]
        ordering = ['-date']

class Schedule(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    start = models.DateTimeField()
    end = models.DateTimeField()
    type = models.CharField(max_length=50, choices=[('inventory_check', 'فحص جرد'), ('patrol', 'دورية')])
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.title