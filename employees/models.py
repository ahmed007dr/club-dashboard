from django.db import models
from django.utils import timezone
from core.models import Club

class Employee(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    card_number = models.CharField(max_length=50, null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    phone_number_2 = models.CharField(max_length=15, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    hire_date = models.DateField(default=timezone.now)
    rfid_code = models.CharField(max_length=32, unique=True, null=True, blank=True)
    default_hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=15.06)
    default_expected_hours = models.FloatField(default=168.0)
    job_title = models.CharField(max_length=100, blank=True)
    gender = models.CharField(
        max_length=10,
        choices=[('male', 'ذكر'), ('female', 'أنثى')],
        blank=True,
        null=True
    )

    def __str__(self):
        return self.full_name

    class Meta:
        indexes = [models.Index(fields=['club', 'full_name'])]


class EmployeeSalary(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salaries')
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    month = models.DateField(help_text="الشهر المستهدف")
    worked_hours = models.FloatField(default=0.0)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)

    def save(self, *args, **kwargs):
        if not self.amount and self.worked_hours:
            self.amount = self.employee.default_hourly_rate * self.worked_hours
        super().save(*args, **kwargs)

    class Meta:
        indexes = [models.Index(fields=['employee', 'month'])]

class EmployeeTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('deduction', 'خصم'),
        ('advance', 'سلف'),
        ('penalty', 'جزاء'),
        ('withdrawal', 'مسحوبات'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='transactions')
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    description = models.TextField(blank=True)
    date = models.DateTimeField(default=timezone.now)
    invoice_number = models.CharField(max_length=100, blank=True, null=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)

    def save(self, *args, **kwargs):
        month = self.date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if not self.employee.salaries.filter(month=month, is_locked=False).exists():
            EmployeeSalary.objects.get_or_create(employee=self.employee, club=self.club, month=month, created_by=self.created_by)
        super().save(*args, **kwargs)
        self.update_employee_balance()

    def update_employee_balance(self):
        from .models import EmployeeFinancialRecord
        month = self.date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        record, _ = EmployeeFinancialRecord.objects.get_or_create(
            employee=self.employee,
            club=self.club,
            month=month,
            defaults={'created_by': self.created_by, 'balance': 0}
        )
        if self.transaction_type in ['deduction', 'advance', 'penalty', 'withdrawal']:
            record.balance -= float(self.amount)
        else:
            record.balance += float(self.amount)
        record.save()

    class Meta:
        indexes = [models.Index(fields=['employee', 'date'])]

class EmployeeFinancialRecord(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='financial_records')
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    month = models.DateField(help_text="الشهر المستهدف")
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)

    class Meta:
        indexes = [models.Index(fields=['employee', 'month'])]

class Supplier(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    contact_info = models.TextField(blank=True)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [models.Index(fields=['club', 'name'])]

class SupplierInvoice(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='invoices')
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    date = models.DateTimeField(default=timezone.now)
    invoice_number = models.CharField(max_length=100, unique=True)
    is_paid = models.BooleanField(default=False)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)

    def save(self, *args, **kwargs):
        if not self.is_paid:
            self.supplier.balance += self.amount
            self.supplier.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.supplier.name} - {self.invoice_number}"

    class Meta:
        indexes = [models.Index(fields=['supplier', 'date'])]