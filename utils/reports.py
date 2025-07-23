from django.db.models import Count, Sum
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from accounts.models import User
from finance.models import Income, Expense
import logging
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)

SOURCE_TRANSLATIONS = {
    "Refund": "استرداد",
    "Renewal": "تجديد",
    "Subscription": "اشتراك"
}

def get_employee_report_data(user, employee_id=None, start_date=None, end_date=None):
    """Generate employee report data with required filters."""
    try:
        # Require at least one filter to proceed
        if not (start_date and end_date) and not employee_id:
            logger.error("Missing required filters: employee_id or date range")
            return {'error': 'يجب تحديد معايير البحث (معرف الموظف، تاريخ البداية، أو تاريخ النهاية).'}, status.HTTP_400_BAD_REQUEST

        employee = get_object_or_404(User, id=employee_id, club=user.club) if employee_id else user

        if start_date and end_date:
            start = parse_datetime(start_date)
            end = parse_datetime(end_date)
            if not start or not end:
                logger.error("Invalid date format: start=%s, end=%s", start_date, end_date)
                return {'error': 'صيغة التاريخ غير صحيحة'}, status.HTTP_400_BAD_REQUEST
            start = timezone.make_aware(start) if timezone.is_naive(start) else start
            end = timezone.make_aware(end) if timezone.is_naive(end) else end
            if start > end:
                logger.error("Start date after end date: start=%s, end=%s", start_date, end_date)
                return {'error': 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية.'}, status.HTTP_400_BAD_REQUEST
        else:
            logger.error("Missing date range: start_date=%s, end_date=%s", start_date, end_date)
            return {'error': 'يجب تحديد تاريخ البداية وتاريخ النهاية.'}, status.HTTP_400_BAD_REQUEST

        income_filters = {'club': employee.club, 'date__gte': start, 'date__lte': end}
        expense_filters = {'club': employee.club, 'date__gte': start, 'date__lte': end}
        if employee_id:
            income_filters['received_by'] = employee
            expense_filters['paid_by'] = employee

        incomes = Income.objects.filter(**income_filters).order_by('date').values('source__name').annotate(
            count=Sum('quantity'), total=Sum('amount')
        )

        expenses = Expense.objects.filter(**expense_filters).order_by('date').values('category__name', 'description').annotate(
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
                {'source': SOURCE_TRANSLATIONS.get(item['source__name'], item['source__name']) or 'غير محدد', 'count': item['count'], 'total': float(item['total'])}
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
    
    except ValueError as e:
        return {'error': str(e)}, status.HTTP_400_BAD_REQUEST
