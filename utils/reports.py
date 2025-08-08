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
from decimal import Decimal

logger = logging.getLogger(__name__)

SOURCE_TRANSLATIONS = {
    "Refund": "استرداد",
    "Renewal": "تجديد",
    "Subscription": "اشتراك"
}

PAYMENT_METHOD_TRANSLATIONS = {
    "Cash": "كاش",
    "Visa": "فيزا"
}

def get_employee_report_data(user, employee_id=None, start_date=None, end_date=None):
    """Generate employee report data with required filters including specific time and payment methods."""
    try:
        # Require at least one filter to proceed
        if not (start_date and end_date) and not employee_id:
            logger.error("Missing required filters: employee_id or date range")
            return {'error': 'يجب تحديد معايير البحث (معرف الموظف، تاريخ البداية، أو تاريخ النهاية).'}, status.HTTP_400_BAD_REQUEST

        employee = get_object_or_404(User, id=employee_id, club=user.club) if employee_id else user

        # تحويل التاريخ والوقت
        if start_date and end_date:
            start = parse_datetime(start_date)
            end = parse_datetime(end_date)
            if not start or not end:
                logger.error("Invalid date format: start=%s, end=%s", start_date, end_date)
                return {'error': 'صيغة التاريخ والوقت غير صحيحة. استخدم صيغة ISO 8601 (مثل 2025-08-06T08:00:00)'}, status.HTTP_400_BAD_REQUEST
            start = timezone.make_aware(start) if timezone.is_naive(start) else start
            end = timezone.make_aware(end) if timezone.is_naive(end) else end
            if start > end:
                logger.error("Start date after end date: start=%s, end=%s", start_date, end_date)
                return {'error': 'تاريخ ووقت البداية يجب أن يكون قبل تاريخ ووقت النهاية.'}, status.HTTP_400_BAD_REQUEST
        else:
            logger.error("Missing date range: start_date=%s, end_date=%s", start_date, end_date)
            return {'error': 'يجب تحديد تاريخ ووقت البداية وتاريخ ووقت النهاية.'}, status.HTTP_400_BAD_REQUEST

        # إعداد الفلاتر الأساسية
        income_filters = {'club': employee.club, 'date__gte': start, 'date__lte': end}
        expense_filters = {'club': employee.club, 'date__gte': start, 'date__lte': end}
        if employee_id:
            income_filters['received_by'] = employee
            expense_filters['paid_by'] = employee

        # تطبيق فلتر الحضور إذا لم يكن المستخدم admin أو owner وكان الموظف هو المستخدم الحالي
        if user.role not in FULL_ACCESS_ROLES and employee == user:
            attendances = StaffAttendance.objects.filter(
                staff=employee, club=user.club, check_in__lte=end, check_out__gte=start
            ).select_related('staff', 'club')

            if not attendances.exists():
                logger.error("No attendance records found for employee: %s", employee.username)
                return {'error': 'لا توجد سجلات حضور للموظف في الفترة المحددة.'}, status.HTTP_404_NOT_FOUND

            # جمع فترات الحضور
            report_filters = []
            for attendance in attendances:
                end_time = attendance.check_out if attendance.check_out else timezone.now()
                report_filters.append(
                    Q(date__gte=attendance.check_in, date__lte=end_time)
                )

            # دمج الفلاتر باستخدام OR
            combined_filter = reduce(or_, report_filters) if report_filters else Q()
            income_filters['combined_filter'] = combined_filter
            expense_filters['combined_filter'] = combined_filter

        # استعلام الإيرادات
        incomes = Income.objects.select_related('source', 'payment_method').filter(**income_filters).only(
            'id', 'amount', 'date', 'source__name', 'payment_method__name', 'quantity'
        )

        # التحقق من وجود سجلات إيرادات بدون طريقة دفع
        null_payment_methods = incomes.filter(payment_method__isnull=True).count()
        if null_payment_methods > 0:
            logger.warning(f"Found {null_payment_methods} income records with no payment method for employee {employee.username}")

        # تجميع الإيرادات حسب المصدر وطريقة الدفع
        incomes_by_source = incomes.values('source__name', 'payment_method__name').annotate(
            count=Sum('quantity'), total=Sum('amount')
        )

        # تجميع الإيرادات حسب طريقة الدفع فقط
        income_by_payment_method = incomes.values('payment_method__name').annotate(
            total_income=Sum('amount')
        ).order_by('payment_method__name')

        # استعلام المصروفات
        expenses = Expense.objects.filter(**expense_filters).values('category__name').annotate(
            total=Sum('amount')
        )

        # حساب الإجماليات
        total_income = incomes.aggregate(total=Sum('amount'))['total'] or Decimal('0.0')
        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.0')
        net_profit = total_income - total_expenses

        # إعداد بيانات طرق الدفع
        payment_methods_data = []
        for item in income_by_payment_method:
            method_name = item['payment_method__name'] or 'غير محدد'
            method_income = item['total_income'] or Decimal('0.0')
            # توزيع المصروفات نسبيًا بناءً على الإيرادات
            method_expense = (method_income / total_income * total_expenses) if total_income > 0 else Decimal('0.0')
            method_net_profit = method_income - method_expense
            logger.debug(f"Payment method {method_name}: income={method_income}, expense={method_expense}, net_profit={method_net_profit}")
            payment_methods_data.append({
                'payment_method': PAYMENT_METHOD_TRANSLATIONS.get(method_name, method_name),
                'total_income': float(method_income),
                'total_expense': float(method_expense),
                'net_profit': float(method_net_profit)
            })

        # إعداد البيانات
        report_data = {
            'employee_name': employee.username,
            'club_name': employee.club.name if employee.club else 'غير محدد',
            'check_in': timezone.localtime(start).isoformat(),
            'check_out': timezone.localtime(end).isoformat(),
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'total_net_profit': float(net_profit),
            'payment_methods': payment_methods_data,
            'incomes': [
                {
                    'source': SOURCE_TRANSLATIONS.get(item['source__name'], item['source__name']) or 'غير محدد',
                    'payment_method': PAYMENT_METHOD_TRANSLATIONS.get(item['payment_method__name'], item['payment_method__name'] or 'غير محدد'),
                    'count': item['count'],
                    'total': float(item['total'])
                }
                for item in incomes_by_source
            ],
            'expenses': [
                {
                    'category': item['category__name'] or 'غير محدد',
                    'total': float(item['total'])
                }
                for item in expenses
            ]
        }

        return report_data, status.HTTP_200_OK
    
    except ValueError as e:
        logger.error(f"Error in get_employee_report_data: {str(e)}")
        return {'error': str(e)}, status.HTTP_400_BAD_REQUEST
    except Exception as e:
        logger.error(f"Unexpected error in get_employee_report_data: {str(e)}")
        return {'error': 'حدث خطأ غير متوقع'}, status.HTTP_500_INTERNAL_SERVER_ERROR