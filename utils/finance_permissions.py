FINANCE_PERMISSION_RULES = {
    'restricted_views': [
        'expense_api', 'income_api', 'expense_detail_api', 'income_detail_api', 'daily_summary_api',
        'income_summary', 'expense_summary', 'finance_overview', 'employee_daily_report_api',
        'expense_all_api', 'income_all_api', 'generate_daily_report_pdf', 'financial_analysis_api',
        'stock_item_api', 'stock_inventory_api', 'stock_profit_api', 'stock_sales_analysis_api'
    ],
    'exempt_views': ['income_source_api', 'expense_category_api'],
    'shift_restricted_roles': ['reception', 'accounting', 'coach'],
    'data_fields': {
        'Income': 'received_by',
        'Expense': 'paid_by',
        'StockTransaction': 'created_by'
    },
    'owner_admin_full_access': True,
    'restrict_to_shift': True
}

def apply_finance_permissions(view_func, request):
    """Apply finance-specific permissions dynamically."""
    from staff.models import StaffAttendance
    from django.utils import timezone
    from django.http import JsonResponse

    if view_func.__name__ in FINANCE_PERMISSION_RULES['exempt_views']:
        return None

    if request.user.role in ['owner', 'admin'] and FINANCE_PERMISSION_RULES['owner_admin_full_access']:
        return None

    if request.user.role in FINANCE_PERMISSION_RULES['shift_restricted_roles'] and FINANCE_PERMISSION_RULES['restrict_to_shift']:
        attendance = StaffAttendance.objects.filter(
            staff=request.user, club=request.user.club, check_out__isnull=True
        ).order_by('-check_in').first()
        if not attendance:
            return JsonResponse({'error': 'لا توجد وردية مفتوحة.'}, status=404)
        return {
            'shift_start': attendance.check_in,
            'shift_end': attendance.check_out or timezone.now(),
            'staff_name': request.user.username
        }

    return JsonResponse({'error': 'غير مسموح بالوصول.'}, status=403)