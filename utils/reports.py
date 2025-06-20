from django.db.models import Count, Sum
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from accounts.models import User
from finance.models import Income, Expense
from staff.models import StaffAttendance
import logging

logger = logging.getLogger(__name__)

def get_employee_report_data(user, employee_id=None, start_date=None, end_date=None):
    """Generate employee report data based on shift for non-owner/admin."""
    if employee_id and user.role in ['owner', 'admin']:
        try:
            query = User.objects.filter(id=employee_id)
            if user.role == 'admin':
                query = query.filter(club=user.club)
            employee = query.first()
            if not employee:
                logger.error("Employee not found: employee_id=%s", employee_id)
                return {'error': 'الموظف غير موجود أو لا ينتمي إلى النادي'}, status.HTTP_404_NOT_FOUND
        except User.DoesNotExist:
            logger.error("Employee not found: employee_id=%s", employee_id)
            return {'error': 'الموظف غير موجود أو لا ينتمي إلى النادي'}, status.HTTP_404_NOT_FOUND
    else:
        employee = user
        if user.role not in ['owner', 'admin'] and employee_id:
            logger.warning("Non-admin user attempted to access another employee's report: user=%s, employee_id=%s", 
                          user.username, employee_id)
            return {'error': 'غير مسموح لك بمشاهدة تقارير موظف آخر'}, status.HTTP_403_FORBIDDEN

    # تحديد الفترة الزمنية
    if user.role in ['owner', 'admin']:
        if start_date and end_date:
            start = parse_datetime(start_date)
            end = parse_datetime(end_date)
            if not start or not end:
                logger.error("Invalid date format: start=%s, end=%s", start_date, end_date)
                return {'error': 'صيغة التاريخ غير صحيحة'}, status.HTTP_400_BAD_REQUEST
            start = timezone.make_aware(start) if timezone.is_naive(start) else start
            end = timezone.make_aware(end) if timezone.is_naive(end) else end
        else:
            start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            end = timezone.now()
    else:
        attendance = StaffAttendance.objects.filter(
            staff=employee, club=employee.club, check_out__isnull=True
        ).order_by('-check_in').first()
        if not attendance:
            logger.warning("No open shift found for user: %s", employee.username)
            return {'error': 'لا توجد وردية مفتوحة. يجب تسجيل حضور أولاً.'}, status.HTTP_404_NOT_FOUND
        start = attendance.check_in
        end = attendance.check_out or timezone.now()

    income_filters = {'club': employee.club, 'date__gte': start, 'date__lte': end, 'received_by': employee}
    expense_filters = {'club': employee.club, 'date__gte': start, 'date__lte': end, 'paid_by': employee}

    incomes = Income.objects.filter(**income_filters).values('source__name').annotate(
        count=Count('id'), total=Sum('amount')
    )

    expenses = Expense.objects.filter(**expense_filters).values('category__name', 'description').annotate(
        total=Sum('amount')
    )

    total_income = sum(item['total'] or 0 for item in incomes)
    total_expenses = sum(item['total'] or 0 for item in expenses)
    net_profit = total_income - total_expenses

    report_data = {
        'employee_name': employee.username,
        'club_name': employee.club.name if employee.club else 'غير محدد',
        'check_in': timezone.localtime(start).isoformat(),
        'check_out': timezone.localtime(end).isoformat(),
        'incomes': [
            {'source': item['source__name'] or 'غير محدد', 'count': item['count'], 'total': float(item['total'])}
            for item in incomes
        ],
        'expenses': [
            {'category': item['category__name'] or 'غير محدد', 'description': item['description'] or 'بدون وصف', 
             'total': float(item['total'])}
            for item in expenses
        ],
        'total_income': float(total_income),
        'total_expenses': float(total_expenses),
        'net_profit': float(net_profit)
    }

    return report_data, status.HTTP_200_OK