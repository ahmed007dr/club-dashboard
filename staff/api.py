from datetime import datetime
from dateutil.relativedelta import relativedelta
from django.db.models import Sum, Count, ExpressionWrapper, F, DurationField, Q
from django.db.models.functions import TruncMonth, TruncDate, Concat
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from .models import Shift, StaffAttendance
from .serializers import ShiftSerializer, StaffAttendanceSerializer, StaffMonthlyHoursSerializer
from accounts.models import User
from utils.permissions import IsOwnerOrRelatedToClub


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def staff_shifts_api(request, staff_id):
    """Retrieve all shifts for a specific staff member, filtered by user's club."""
    shifts = Shift.objects.filter(
        staff_id=staff_id,
        club=request.user.club
    ).select_related('club', 'approved_by').order_by('-date')

    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(shifts, request)
    serializer = ShiftSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def shift_list_api(request):
    """Retrieve a list of shifts, filtered by user's club with optional filters."""
    shifts = Shift.objects.filter(
        club=request.user.club
    ).select_related('club', 'staff', 'approved_by').order_by('-date')

    # Apply filters
    if 'club_name' in request.GET:
        club_name = request.GET['club_name']
        shifts = shifts.filter(club__name=club_name)
    
    if 'staff_search' in request.GET:
        search_term = request.GET['staff_search'].strip()
        if search_term:
            name_parts = search_term.split()
            base_query = (
                Q(staff__username__icontains=search_term) |
                Q(staff__first_name__icontains=search_term) |
                Q(staff__last_name__icontains=search_term)
            )
            if len(name_parts) > 1:
                first_last = Q(
                    staff__first_name__icontains=name_parts[0],
                    staff__last_name__icontains=name_parts[1]
                )
                last_first = Q(
                    staff__first_name__icontains=name_parts[1],
                    staff__last_name__icontains=name_parts[0]
                )
                full_name_query = Q(
                    staff__full_name__icontains=search_term
                ) if hasattr(Shift.staff.field.related_model, 'full_name') else Q()
                shifts = shifts.filter(
                    base_query | first_last | last_first | full_name_query
                )
            else:
                shifts = shifts.filter(base_query)
    
    if 'date' in request.GET:
        try:
            date = datetime.strptime(request.GET['date'], '%Y-%m-%d').date()
            shifts = shifts.filter(date=date)
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
    
    if 'date_min' in request.GET:
        try:
            date_min = datetime.strptime(request.GET['date_min'], '%Y-%m-%d').date()
            shifts = shifts.filter(date__gte=date_min)
        except ValueError:
            return Response({'error': 'Invalid date_min format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
    
    if 'date_max' in request.GET:
        try:
            date_max = datetime.strptime(request.GET['date_max'], '%Y-%m-%d').date()
            shifts = shifts.filter(date__lte=date_max)
        except ValueError:
            return Response({'error': 'Invalid date_max format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(shifts, request)
    serializer = ShiftSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_shift_api(request):
    """Create a new shift with validation and permission checks."""
    data = request.data.copy()
    if 'approved_by' not in data:
        data['approved_by'] = request.user.id

    serializer = ShiftSerializer(data=data)
    if serializer.is_valid():
        shift = serializer.save()
        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, shift):
            shift.delete()
            return Response(
                {'error': 'You do not have permission to create a shift for this club'},
                status=status.HTTP_403_FORBIDDEN
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def shift_detail_api(request, shift_id):
    """Retrieve details of a specific shift."""
    shift = get_object_or_404(Shift, id=shift_id, club=request.user.club)
    serializer = ShiftSerializer(shift)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def edit_shift_api(request, shift_id):
    """Update an existing shift (Owner or Admin only)."""
    shift = get_object_or_404(Shift, id=shift_id, club=request.user.club)
    serializer = ShiftSerializer(shift, data=request.data, partial=True)
    if serializer.is_valid():
        updated_shift = serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_shift_api(request, shift_id):
    """Delete a specific shift (Owner or Admin only)."""
    shift = get_object_or_404(Shift, id=shift_id, club=request.user.club)
    shift.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# Attendance Management APIs
def find_current_shift(user):
    """Find the current shift for a user, handling shifts that span across two days."""
    now = timezone.now()
    today = now.date()
    yesterday = today - timezone.timedelta(days=1)
    current_time = now.time()

    shifts = Shift.objects.filter(staff=user, club=user.club).select_related('club')

    for shift in shifts:
        shift_start_dt = datetime.combine(shift.date, shift.shift_start)
        shift_end_date = shift.shift_end_date or shift.date
        shift_end_dt = datetime.combine(shift_end_date, shift.shift_end)

        if shift_end_dt < shift_start_dt:
            shift_end_dt += timezone.timedelta(days=1)

        shift_start_dt = timezone.make_aware(shift_start_dt)
        shift_end_dt = timezone.make_aware(shift_end_dt)

        if shift_start_dt <= now <= shift_end_dt:
            return shift

    return None

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def staff_check_in_by_code_api(request):
    """Record staff check-in using RFID code for any active user. Auto-checkout if needed."""
    rfid_code = request.data.get('rfid_code')
    if not rfid_code:
        return Response({'error': 'RFID code is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(rfid_code=rfid_code, is_active=True)
    except User.DoesNotExist:
        return Response({'error': 'Invalid RFID code or inactive user'}, status=status.HTTP_404_NOT_FOUND)

    open_attendances = StaffAttendance.objects.filter(staff=user, check_out__isnull=True)
    for attendance in open_attendances:
        if attendance.shift:
            shift_end_date = attendance.shift.shift_end_date or attendance.shift.date
            shift_end_dt = datetime.combine(shift_end_date, attendance.shift.shift_end)
            shift_end_dt = timezone.make_aware(shift_end_dt)

            if shift_end_dt < timezone.now():
                attendance.check_out = shift_end_dt
            else:
                attendance.check_out = timezone.now()
        else:
            attendance.check_out = timezone.now()
        attendance.save()

    shift = find_current_shift(user)
    attendance = StaffAttendance.objects.create(
        staff=user,
        club=user.club,
        shift=shift,
        check_in=timezone.now()
    )
    return Response(StaffAttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def staff_check_out_by_code_api(request):
    """Record staff check-out using RFID code for any active user."""
    rfid_code = request.data.get('rfid_code')
    if not rfid_code:
        return Response({'error': 'RFID code is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(rfid_code=rfid_code, is_active=True)
    except User.DoesNotExist:
        return Response({'error': 'Invalid RFID code or inactive user'}, status=status.HTTP_404_NOT_FOUND)

    attendance = StaffAttendance.objects.filter(staff=user, check_out__isnull=True).order_by('-check_in').first()
    if not attendance:
        return Response({'error': 'No active check-in found'}, status=status.HTTP_400_BAD_REQUEST)

    attendance.check_out = timezone.now()
    attendance.save()
    return Response(StaffAttendanceSerializer(attendance).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_attendance_analysis_api(request, attendance_id):
    """Analyze a specific attendance record for punctuality and duration."""
    try:
        attendance = StaffAttendance.objects.get(id=attendance_id, club=request.user.club)
    except StaffAttendance.DoesNotExist:
        return Response({'error': 'سجل الحضور غير موجود'}, status=status.HTTP_404_NOT_FOUND)

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
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def staff_attendance_report_api(request, staff_id):
    """Generate a report of attendance days and total hours for a staff member."""
    try:
        staff = User.objects.get(id=staff_id, is_active=True)
    except User.DoesNotExist:
        return Response({'error': 'Staff not found'}, status=status.HTTP_404_NOT_FOUND)

    attendances = StaffAttendance.objects.filter(staff=staff, club=request.user.club)

    attendance_days = attendances.annotate(date=TruncDate('check_in')) \
                                 .values('date') \
                                 .distinct() \
                                 .count()
    total_hours = sum(
        attendance.duration_hours() or 0
        for attendance in attendances
        if attendance.check_out
    )

    return Response({
        'staff_id': staff.id,
        'staff_name': staff.username,
        'rfid_code': staff.rfid_code,
        'attendance_days': attendance_days,
        'total_hours': round(total_hours, 2)
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def missing_checkins_api(request):
    """Retrieve staff who have shifts today but haven't checked in."""
    today = timezone.now().date()
    shifts = Shift.objects.filter(date=today, club=request.user.club).select_related('staff', 'club')
    
    missing_checkins = []
    for shift in shifts:
        if not StaffAttendance.objects.filter(
            staff=shift.staff,
            check_in__date=today,
            shift=shift,
            club=request.user.club
        ).exists():
            missing_checkins.append({
                "shift_id": shift.id,
                "staff_id": shift.staff.id,
                "staff_name": shift.staff.username,
                "rfid_code": shift.staff.rfid_code,
                "club_id": shift.club.id,
                "club_name": shift.club.name,
                "shift_start": shift.shift_start.strftime("%H:%M:%S"),
                "shift_end": shift.shift_end.strftime("%H:%M:%S")
            })
    
    return Response(missing_checkins)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_list_api(request):
    """Retrieve a list of all staff attendance records with staff name, check-in, check-out, club, and duration."""
    attendances = StaffAttendance.objects.filter(
        club=request.user.club
    ).select_related('staff', 'club', 'shift')
    
    serializer = StaffAttendanceSerializer(attendances, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def staff_monthly_hours_report_api(request):
    """
    Generate a report of total attendance hours and days per staff member for each month.
    Includes RFID code, staff name, total hours, attendance days, and percentage change
    in hours compared to the previous month.
    """
    attendances = StaffAttendance.objects.filter(
        check_out__isnull=False,
        club=request.user.club
    )
    
    if 'staff_id' in request.GET:
        try:
            staff_id = int(request.GET['staff_id'])
            attendances = attendances.filter(staff_id=staff_id)
        except ValueError:
            return Response({'error': 'Invalid staff_id'}, status=status.HTTP_400_BAD_REQUEST)
    
    if 'year' in request.GET:
        try:
            year = int(request.GET['year'])
            attendances = attendances.filter(check_in__year=year)
        except ValueError:
            return Response({'error': 'Invalid year format'}, status=status.HTTP_400_BAD_REQUEST)
    
    monthly_data = attendances.annotate(
        month=TruncMonth('check_in')
    ).values(
        'staff__id',
        'staff__username',
        'staff__rfid_code',
        'month'
    ).annotate(
        total_hours=Sum(
            ExpressionWrapper(
                F('check_out') - F('check_in'),
                output_field=DurationField()
            )
        ),
        attendance_days=Count(
            TruncDate('check_in'),
            distinct=True
        )
    ).order_by('staff__id', 'month')
    
    staff_monthly_map = {}
    for entry in monthly_data:
        staff_id = entry['staff__id']
        month = entry['month']
        total_hours = entry['total_hours'].total_seconds() / 3600
        if staff_id not in staff_monthly_map:
            staff_monthly_map[staff_id] = {}
        staff_monthly_map[staff_id][month] = total_hours
    
    serializer = StaffMonthlyHoursSerializer(
        monthly_data,
        many=True,
        context={'monthly_data': staff_monthly_map}
    )
    return Response(serializer.data)