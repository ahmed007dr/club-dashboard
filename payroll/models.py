from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
from accounts.models import User
from core.models import Club
from subscriptions.models import PrivateSubscriptionPayment
from staff.models import StaffAttendance
from finance.models import Expense, ExpenseCategory

class PayrollPeriod(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='payroll_periods')
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True, help_text="Is this the current payroll period?")
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.end_date <= self.start_date:
            raise ValidationError("End date must be after start date")
        if self.is_active:
            existing_active = PayrollPeriod.objects.filter(club=self.club, is_active=True).exclude(pk=self.pk)
            if existing_active.exists():
                raise ValidationError("Only one payroll period can be active per club")

    def __str__(self):
        return f"{self.club.name}: {self.start_date} to {self.end_date}"

    class Meta:
        unique_together = ['club', 'start_date']
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['start_date']),
            models.Index(fields=['end_date']),
            models.Index(fields=['is_active']),
        ]

class EmployeeContract(models.Model):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payroll_contracts'
    )
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    hourly_rate = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Hourly rate for the employee (EGP)"
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee.username} - {self.hourly_rate} EGP/hour"

    class Meta:
        unique_together = ['employee', 'club']
        indexes = [
            models.Index(fields=['employee']),
            models.Index(fields=['club']),
            models.Index(fields=['start_date']),
        ]

class CoachPercentage(models.Model):
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payroll_percentages',
        limit_choices_to={'role': 'coach'}
    )
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    coach_percentage = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=70.00,
        help_text="Coach's percentage for private subscriptions"
    )
    club_percentage = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=30.00,
        help_text="Club's percentage for private subscriptions"
    )
    effective_date = models.DateField(
        help_text="Date when this percentage takes effect"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.coach_percentage + self.club_percentage != 100:
            raise ValidationError("Coach and club percentages must sum to 100%")

    def __str__(self):
        return f"{self.coach.username} - {self.coach_percentage}%"

    class Meta:
        unique_together = ['coach', 'club', 'effective_date']
        indexes = [
            models.Index(fields=['coach']),
            models.Index(fields=['club']),
            models.Index(fields=['effective_date']),
        ]

class PayrollDeduction(models.Model):
    payroll = models.ForeignKey(
        'Payroll',
        on_delete=models.CASCADE,
        related_name='deductions'
    )
    amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Deduction amount (EGP)"
    )
    reason = models.CharField(
        max_length=255,
        help_text="Reason for the deduction"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.payroll.employee.username} - {self.amount} EGP: {self.reason}"

    class Meta:
        indexes = [
            models.Index(fields=['payroll']),
            models.Index(fields=['created_at']),
        ]

class Payroll(models.Model):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payroll_records'
    )
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    period = models.ForeignKey(
        PayrollPeriod,
        on_delete=models.CASCADE,
        related_name='payrolls'
    )
    expected_hours = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=0,
        help_text="Expected hours for the period (entered manually, 0 for non-employees)"
    )
    actual_hours = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=0,
        help_text="Actual hours worked in the period"
    )
    absent_hours = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=0,
        help_text="Absent hours in the period"
    )
    base_salary = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=0,
        help_text="Base salary (actual hours * hourly rate)"
    )
    absence_deduction = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=0,
        help_text="Deduction due to absent hours"
    )
    private_earnings = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=0,
        help_text="Earnings from private subscriptions (for coaches)"
    )
    bonuses = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=0,
        help_text="Bonuses for the period"
    )
    total_deductions = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=0,
        help_text="Total deductions (absence_deduction + additional deductions)"
    )
    total_salary = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Total salary (base salary + private earnings + bonuses - total deductions)"
    )
    is_finalized = models.BooleanField(
        default=False,
        help_text="Is this payroll finalized and ready to be recorded as an expense?"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def calculate_payroll(self):
        contract = EmployeeContract.objects.filter(
            employee=self.employee, club=self.club,
            start_date__lte=self.period.start_date
        ).first()

        if contract:
            attendances = StaffAttendance.objects.filter(
                staff=self.employee,
                club=self.club,
                check_in__gte=self.period.start_date,
                check_in__lte=self.period.end_date
            )
            self.actual_hours = sum(att.duration_hours() for att in attendances if att.duration_hours()) or 0
            self.absent_hours = max(0, self.expected_hours - self.actual_hours)
            self.base_salary = self.actual_hours * contract.hourly_rate
            self.absence_deduction = self.absent_hours * contract.hourly_rate
        else:
            self.actual_hours = 0
            self.absent_hours = 0
            self.base_salary = 0
            self.absence_deduction = 0

        self.private_earnings = 0
        if self.employee.role == 'coach':
            private_payments = PrivateSubscriptionPayment.objects.filter(
                subscription__coach=self.employee,
                subscription__club=self.club,
                created_at__gte=self.period.start_date,
                created_at__lte=self.period.end_date
            )
            self.private_earnings = sum(payment.coach_share for payment in private_payments) or 0

        additional_deductions = sum(deduction.amount for deduction in self.deductions.all()) or 0
        self.total_deductions = self.absence_deduction + additional_deductions
        self.total_salary = self.base_salary + self.private_earnings + self.bonuses - self.total_deductions

    def finalize(self):
        """Mark payroll as finalized and record as expense."""
        if not self.is_finalized:
            self.is_finalized = True
            self.save()

            # Record total_salary as Expense
            category, created = ExpenseCategory.objects.get_or_create(
                club=self.club,
                name='Payroll',
                defaults={'description': 'Expenses for employee salaries'}
            )
            expense = Expense(
                club=self.club,
                category=category,
                amount=self.total_salary,
                description=f"Salary for {self.employee.username} for period {self.period}",
                date=datetime.now().date(),
                paid_by=self.employee
            )
            expense.save()

    def save(self, *args, **kwargs):
        if not self.pk:
            self.calculate_payroll()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.username} - {self.period}"

    class Meta:
        unique_together = ['employee', 'club', 'period']
        indexes = [
            models.Index(fields=['employee']),
            models.Index(fields=['club']),
            models.Index(fields=['period']),
        ]