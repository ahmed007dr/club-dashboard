from django.urls import path
from .api import (
    get_payroll_periods, create_payroll_period, get_current_period,
    get_payroll_report, create_payroll, create_deduction, finalize_payroll,get_payroll_details
)

urlpatterns = [
    path('periods/', get_payroll_periods, name='get_payroll_periods'),
    path('periods/create/', create_payroll_period, name='create_payroll_period'),
    path('current-period/', get_current_period, name='get_current_period'),
    path('report/', get_payroll_report, name='get_payroll_report'),
    path('payrolls/create/', create_payroll, name='create_payroll'),
    path('deductions/create/', create_deduction, name='create_deduction'),
    path('finalize/', finalize_payroll, name='finalize_payroll'),
    path('payrolls/<int:payroll_id>/', get_payroll_details, name='get_payroll_details'),
]