from datetime import datetime
from dateutil.relativedelta import relativedelta
from django.db.models import Sum
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from .models import Shift, StaffAttendance
from .serializers import ShiftSerializer, StaffAttendanceSerializer, StaffMonthlyHoursSerializer
from employees.models import Employee, EmployeeSalary, EmployeeTransaction
from employees.serializers import EmployeeSalarySerializer, EmployeeTransactionSerializer
from accounts.models import User
from accounts.serializers import UserProfileSerializer
import logging
from django.db.models import Count, Sum, Avg, Q, BooleanField, Case, When, F, Max, IntegerField, FloatField, Value, ExpressionWrapper, DecimalField, OuterRef, Subquery
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncYear, TruncHour

logger = logging.getLogger(__name__)

FULL_ACCESS_ROLES = ['owner', 'admin']

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_shifts_api(request, staff_id):
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح'}, status=status.HTTP_403_FORBIDDEN)
    staff = get_object_or_404(Employee, id=staff_id, club=request.user.club)
    shifts = Shift.objects.filter(staff=staff, club=request.user.club).order_by('-date')
    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(shifts, request)
    serializer = ShiftSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shift_list_api(request):
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح'}, status=status.HTTP_403_FORBIDDEN)
    shifts = Shift.objects.filter(club=request.user.club).order_by('-date')
    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(shifts, request)
    serializer = ShiftSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_shift_api(request):
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح'}, status=status.HTTP_403_FORBIDDEN)
    data = request.data.copy()
    data['approved_by'] = request.user.id
    serializer = ShiftSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shift_detail_api(request, shift_id):
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح'}, status=status.HTTP_403_FORBIDDEN)
    shift = get_object_or_404(Shift, id=shift_id, club=request.user.club)
    serializer = ShiftSerializer(shift)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_shift_api(request, shift_id):
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح'}, status=status.HTTP_403_FORBIDDEN)
    if request.user.role not in FULL_ACCESS_ROLES:
        return Response({'error': 'غير مسموح بالتعديل'}, status=status.HTTP_403_FORBIDDEN)
    shift = get_object_or_404(Shift, id=shift_id, club=request.user.club)
    serializer = ShiftSerializer(shift, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_shift_api(request, shift_id):
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح'}, status=status.HTTP_403_FORBIDDEN)
    if request.user.role not in FULL_ACCESS_ROLES:
        return Response({'error': 'غير مسموح بالحذف'}, status=status.HTTP_403_FORBIDDEN)
    shift = get_object_or_404(Shift, id=shift_id, club=request.user.club)
    shift.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def staff_check_in_by_code_api(request):
    logger.debug(f"Check-in request: {request.data}, User: {request.user.username}")
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'لا يوجد نادي مرتبط بك'}, status=status.HTTP_400_BAD_REQUEST)
    rfid_code = request.data.get('rfid_code')
    if not rfid_code:
        logger.error("No RFID code provided")
        return Response({'error': 'رمز RFID مطلوب'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        employee = Employee.objects.get(rfid_code=rfid_code, club=request.user.club)
    except Employee.DoesNotExist:
        logger.error(f"Invalid RFID code: {rfid_code}")
        return Response({'error': 'رمز RFID غير صالح'}, status=status.HTTP_404_NOT_FOUND)
    open_attendances = StaffAttendance.objects.filter(staff=employee, check_out__isnull=True)
    for attendance in open_attendances:
        attendance.check_out = timezone.now()
        attendance.save()
    attendance = StaffAttendance.objects.create(staff=employee, club=request.user.club, check_in=timezone.now(), created_by=request.user)
    logger.info(f"Check-in created: {attendance.id} for employee: {employee.full_name}")
    return Response(StaffAttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def staff_check_out_by_code_api(request):
    logger.debug(f"Check-out request: {request.data}, User: {request.user.username}")
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'لا يوجد نادي مرتبط بك'}, status=status.HTTP_400_BAD_REQUEST)
    rfid_code = request.data.get('rfid_code')
    if not rfid_code:
        logger.error("No RFID code provided")
        return Response({'error': 'رمز RFID مطلوب'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        employee = Employee.objects.get(rfid_code=rfid_code, club=request.user.club)
    except Employee.DoesNotExist:
        logger.error(f"Invalid RFID code: {rfid_code}")
        return Response({'error': 'رمز RFID غير صالح'}, status=status.HTTP_404_NOT_FOUND)
    attendance = StaffAttendance.objects.filter(staff=employee, check_out__isnull=True).order_by('-check_in').first()
    if not attendance:
        logger.error(f"No active attendance for employee: {employee.full_name}")
        return Response({'error': 'لا يوجد حضور مفتوح'}, status=status.HTTP_400_BAD_REQUEST)
    attendance.check_out = timezone.now()
    attendance.save()
    logger.info(f"Check-out recorded: {attendance.id} for employee: {employee.full_name}")
    # Update worked hours and salary
    current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    salary = EmployeeSalary.objects.filter(employee=employee, month=current_month).first()
    if salary and not salary.is_locked:
        attendances = StaffAttendance.objects.filter(staff=employee, check_in__month=current_month.month, check_in__year=current_month.year, check_out__isnull=False)
        worked_hours = sum((a.check_out - a.check_in).total_seconds() / 3600 for a in attendances)
        salary.worked_hours = worked_hours
        salary.amount = employee.default_hourly_rate * worked_hours
        salary.save()
    return Response(StaffAttendanceSerializer(attendance).data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_attendance_analysis_api(request, attendance_id):
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح'}, status=status.HTTP_403_FORBIDDEN)
    attendance = get_object_or_404(StaffAttendance, id=attendance_id, club=request.user.club)
    if not attendance.shift:
        return Response({'status': 'no_shift'})
    shift_start_dt = datetime.combine(attendance.shift.date, attendance.shift.shift_start)
    shift_end_date = attendance.shift.shift_end_date or attendance.shift.date
    shift_end_dt = datetime.combine(shift_end_date, attendance.shift.shift_end)
    if shift_end_dt < shift_start_dt:
        shift_end_dt += timezone.timedelta(days=1)
    shift_start_dt = timezone.make_aware(shift_start_dt)
    shift_end_dt = timezone.make_aware(shift_end_dt)
    check_in = attendance.check_in
    check_out = attendance.check_out or timezone.now()
    expected_hours = (shift_end_dt - shift_start_dt).total_seconds() / 3600
    actual_hours = (check_out - check_in).total_seconds() / 3600
    late_by = max(0, (check_in - shift_start_dt).total_seconds() / 60) if check_in > shift_start_dt else 0
    left_early_by = max(0, (shift_end_dt - check_out).total_seconds() / 60) if check_out < shift_end_dt else 0
    status_str = "on_time"
    if late_by and left_early_by:
        status_str = "late_and_left_early"
    elif late_by:
        status_str = "late"
    elif left_early_by:
        status_str = "left_early"
    return Response({
        "status": status_str,
        "late_by_minutes": round(late_by),
        "left_early_by_minutes": round(left_early_by),
        "actual_hours": round(actual_hours, 2),
        "expected_hours": round(expected_hours, 2)
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_attendance_report_api(request, staff_id=None):
    """Retrieve attendance report for staff with salary and transaction details."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح'}, status=status.HTTP_403_FORBIDDEN)
    
    attendances = StaffAttendance.objects.filter(check_out__isnull=False, club=request.user.club)
    if staff_id:
        try:
            staff_id = int(staff_id)
            attendances = attendances.filter(staff_id=staff_id)
        except ValueError:
            return Response({'error': 'معرف الموظف غير صالح'}, status=status.HTTP_400_BAD_REQUEST)
    
    year = request.query_params.get('year')
    if year:
        try:
            year = int(year)
            attendances = attendances.filter(check_in__year=year)
        except ValueError:
            return Response({'error': 'صيغة السنة غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)
    
    month = request.query_params.get('month')
    if month:
        try:
            year, month = map(int, month.split('-'))
            attendances = attendances.filter(check_in__year=year, check_in__month=month)
        except ValueError:
            return Response({'error': 'صيغة الشهر غير صحيحة (YYYY-MM)'}, status=status.HTTP_400_BAD_REQUEST)
    
    monthly_data = attendances.annotate(month=TruncMonth('check_in')).values(
        'staff__id', 'staff__full_name', 'month'
    ).annotate(
        total_hours=Sum(ExpressionWrapper(F('check_out') - F('check_in'), output_field=DurationField())),
    ).order_by('-month', 'staff__id')
    
    staff_data = {}
    for entry in monthly_data:
        staff_id = entry['staff__id']
        total_hours = entry['total_hours'].total_seconds() / 3600 if entry['total_hours'] else 0
        month_entry = {
            'month': entry['month'].strftime('%Y-%m'),
            'total_hours': round(total_hours, 2),
        }
        if staff_id not in staff_data:
            staff = Employee.objects.get(id=staff_id, club=request.user.club)
            salary = EmployeeSalary.objects.filter(employee=staff, month=entry['month']).first()
            transactions = EmployeeTransaction.objects.filter(employee=staff, date__month=entry['month'].month, date__year=entry['month'].year)
            total_transactions = transactions.aggregate(total=Sum('amount'))['total'] or 0
            staff_data[staff_id] = {
                'staff_id': staff_id,
                'full_name': entry['staff__full_name'] or 'غير متوفر',
                'hourly_rate': float(staff.default_hourly_rate),
                'monthly_data': [],
                'net_salary': float(salary.amount - total_transactions) if salary else 0.0,
                'transactions': EmployeeTransactionSerializer(transactions, many=True).data if transactions.exists() else []
            }
        staff_data[staff_id]['monthly_data'].append(month_entry)
    
    staff_list = list(staff_data.values())
    serializer = StaffMonthlyHoursSerializer(staff_list, many=True)
    return Response(serializer.data)