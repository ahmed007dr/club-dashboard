from django.db.models import Count, Sum
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from accounts.models import User
from staff.models import StaffAttendance
from finance.models import Income, Expense
import logging
from django.shortcuts import get_object_or_404
from django.db.models import Q
from functools import reduce
from operator import or_

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

        # إعداد الفلاتر الأساسية
        income_filters = {'club': employee.club}
        expense_filters = {'club': employee.club}
        if employee_id:
            income_filters['received_by'] = employee
            expense_filters['paid_by'] = employee

        # تطبيق فلتر الحضور إذا لم يكن المستخدم admin أو owner وكان الموظف هو المستخدم الحالي
        if user.role not in ['admin', 'owner'] and employee == user:
            attendances = StaffAttendance.objects.filter(
                staff=employee, club=user.club, check_in__gte=start, check_in__lte=end
            ).select_related('staff', 'club')

            if not attendances.exists():
                logger.error("No attendance records found for employee: %s", employee.username)
                return {'error': 'لا توجد سجلات حضور للموظف.'}, status.HTTP_404_NOT_FOUND

            # جمع فترات الحضور
            report_filters = []
            for attendance in attendances:
                end_time = attendance.check_out if attendance.check_out else timezone.now()
                report_filters.append(
                    Q(date__gte=attendance.check_in, date__lt=end_time)
                )

            # دمج الفلاتر باستخدام OR
            combined_filter = reduce(or_, report_filters) if report_filters else Q()
            income_filters.update(combined_filter=combined_filter)
            expense_filters.update(combined_filter=combined_filter)
        else:
            # لـ admin/owner، تطبيق فلتر التاريخ فقط
            income_filters.update({'date__gte': start, 'date__lte': end})
            expense_filters.update({'date__gte': start, 'date__lte': end})

        # استعلام الإيرادات
        incomes = Income.objects.filter(**income_filters).values('source__name').annotate(
            count=Sum('quantity'), total=Sum('amount')
        )

        # استعلام المصروفات
        expenses = Expense.objects.filter(**expense_filters).values('category__name').annotate(
            total=Sum('amount')
        )

        # حساب الإجماليات
        total_income = sum(item['total'] or 0 for item in incomes)
        total_expenses = sum(item['total'] or 0 for item in expenses)
        net_profit = total_income - total_expenses

        # إعداد البيانات
        report_data = {
            'employee_name': employee.username,
            'club_name': employee.club.name if employee.club else 'غير محدد',
            'check_in': timezone.localtime(start).isoformat(),
            'check_out': timezone.localtime(end).isoformat(),
            'incomes': [
                {
                    'source': SOURCE_TRANSLATIONS.get(item['source__name'], item['source__name']) or 'غير محدد',
                    'count': item['count'],
                    'total': float(item['total'])
                }
                for item in incomes
            ],
            'expenses': [
                {
                    'category': item['category__name'] or 'غير محدد',
                    'total': float(item['total'])
                }
                for item in expenses
            ],
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'net_profit': float(net_profit)
        }

        return report_data, status.HTTP_200_OK
    
    except ValueError as e:
        return {'error': str(e)}, status.HTTP_400_BAD_REQUEST