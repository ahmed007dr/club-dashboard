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
def staff_attendance_report_api(request, staff_id=None):
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

    attendances = StaffAttendance.objects.filter(
        check_out__isnull=False,
        club=request.user.club
    )

    year = request.query_params.get('year', None)
    if staff_id:
        try:
            staff_id = int(staff_id)
            attendances = attendances.filter(staff_id=staff_id)
        except ValueError:
            return Response({'error': 'Invalid staff_id'}, status=status.HTTP_400_BAD_REQUEST)

    if year:
        try:
            year = int(year)
            attendances = attendances.filter(check_in__year=year)
        except ValueError:
            return Response({'error': 'Invalid year format'}, status=status.HTTP_400_BAD_REQUEST)

    # Aggregate data by staff and month
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

    # Group data by staff
    staff_data = {}
    staff_monthly_map = {}
    for entry in monthly_data:
        staff_id = entry['staff__id']
        total_hours = entry['total_hours'].total_seconds() / 3600
        prev_month = entry['month'] - relativedelta(months=1)
        prev_hours = staff_monthly_map.get(staff_id, {}).get(prev_month, 0)

        month_entry = {
            'month': entry['month'],
            'total_hours': round(total_hours, 2),
            'attendance_days': entry['attendance_days'],
            'hours_change': round(total_hours - prev_hours, 2),
            'percentage_change': round(((total_hours - prev_hours) / prev_hours) * 100, 2) if prev_hours > 0 else 0
        }

        if staff_id not in staff_data:
            staff_data[staff_id] = {
                'staff_id': staff_id,
                'staff_name': entry['staff__username'],
                'rfid_code': entry['staff__rfid_code'],
                'monthly_data': []
            }
        staff_data[staff_id]['monthly_data'].append(month_entry)

        # Update staff_monthly_map for next iteration
        if staff_id not in staff_monthly_map:
            staff_monthly_map[staff_id] = {}
        staff_monthly_map[staff_id][entry['month']] = total_hours

    # Convert staff_data to list for serialization
    staff_list = list(staff_data.values())
    serializer = StaffMonthlyHoursSerializer(staff_list, many=True)
    return Response(serializer.data)

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
