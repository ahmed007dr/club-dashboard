from django.contrib import admin
from .models import EmployeeContract, CoachPercentage, Payroll, PayrollDeduction, PayrollPeriod

@admin.register(PayrollPeriod)
class PayrollPeriodAdmin(admin.ModelAdmin):
    list_display = ('club', 'start_date', 'end_date', 'is_active')
    list_filter = ('club', 'is_active')
    search_fields = ('club__name',)

@admin.register(EmployeeContract)
class EmployeeContractAdmin(admin.ModelAdmin):
    list_display = ('employee', 'club', 'hourly_rate', 'start_date')
    list_filter = ('club', 'start_date')
    search_fields = ('employee__username', 'club__name')

@admin.register(CoachPercentage)
class CoachPercentageAdmin(admin.ModelAdmin):
    list_display = ('coach', 'club', 'coach_percentage', 'club_percentage', 'effective_date')
    list_filter = ('club', 'effective_date')
    search_fields = ('coach__username', 'club__name')

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('employee', 'club', 'period', 'expected_hours', 'actual_hours', 'absent_hours', 'base_salary', 'absence_deduction', 'private_earnings', 'bonuses', 'total_salary')
    list_filter = ('club', 'period')
    search_fields = ('employee__username', 'club__name')
    fieldsets = (
        (None, {
            'fields': ('employee', 'club', 'period', 'expected_hours')
        }),
        ('Payroll Details', {
            'fields': ('actual_hours', 'absent_hours', 'base_salary', 'absence_deduction', 'private_earnings', 'bonuses', 'total_salary')
        }),
    )

@admin.register(PayrollDeduction)
class PayrollDeductionAdmin(admin.ModelAdmin):
    list_display = ('payroll', 'amount', 'reason', 'created_at')
    list_filter = ('payroll__period',)
    search_fields = ('payroll__employee__username', 'reason')