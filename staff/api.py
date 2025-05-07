from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime
from .models import Shift, StaffAttendance
from .serializers import ShiftSerializer, StaffAttendanceSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub
from accounts.models import User
from rest_framework.exceptions import ValidationError

# Shift Management APIs
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def shift_list_api(request):
    """Retrieve a list of shifts based on user role and club association."""
    shifts = Shift.objects.select_related('club', 'staff', 'approved_by')
    if request.user.role != 'owner':
        shifts = shifts.filter(club=request.user.club)
    
    serializer = ShiftSerializer(shifts, many=True)
    return Response(serializer.data)

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
    shift = get_object_or_404(Shift, id=shift_id)
    serializer = ShiftSerializer(shift)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def edit_shift_api(request, shift_id):
    """Update an existing shift with permission checks."""
    shift = get_object_or_404(Shift, id=shift_id)
    serializer = ShiftSerializer(shift, data=request.data, partial=True)
    if serializer.is_valid():
        updated_shift = serializer.save()
        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, updated_shift):
            return Response(
                {'error': 'You do not have permission to update this shift to this club'},
                status=status.HTTP_403_FORBIDDEN
            )
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_shift_api(request, shift_id):
    """Delete a specific shift."""
    shift = get_object_or_404(Shift, id=shift_id)
    shift.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def staff_shifts_api(request, staff_id):
    """Retrieve all shifts for a specific staff member."""
    shifts = Shift.objects.filter(staff_id=staff_id).select_related('club', 'approved_by')
    if request.user.role != 'owner':
        shifts = shifts.filter(club=request.user.club)
    
    serializer = ShiftSerializer(shifts, many=True)
    return Response(serializer.data)

# Attendance Management APIs
def find_current_shift(user):
    """Find the current shift for a user, handling shifts that span across two days."""
    now = timezone.now()
    today = now.date()
    yesterday = today - timezone.timedelta(days=1)

    current_time = now.time()

    shifts = Shift.objects.filter(staff=user).select_related('club')

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
def staff_check_in_by_code_api(request):
    """Record staff check-in using RFID code."""
    rfid_code = request.data.get('rfid_code')
    if not rfid_code:
        return Response({'error': 'RFID code is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(rfid_code=rfid_code, role='staff')
    except User.DoesNotExist:
        return Response({'error': 'Invalid RFID code'}, status=status.HTTP_404_NOT_FOUND)

    if not user.is_active:
        return Response({'error': 'User account is inactive'}, status=status.HTTP_403_FORBIDDEN)

    if StaffAttendance.objects.filter(staff=user, check_out__isnull=True).exists():
        return Response({'error': 'Already checked in'}, status=status.HTTP_400_BAD_REQUEST)

    shift = find_current_shift(user)
    attendance = StaffAttendance.objects.create(
        staff=user,
        club=user.club,
        shift=shift,
        check_in=timezone.now()
    )
    return Response(StaffAttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def staff_check_out_by_code_api(request):
    """Record staff check-out using RFID code."""
    rfid_code = request.data.get('rfid_code')
    if not rfid_code:
        return Response({'error': 'RFID code is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(rfid_code=rfid_code, role='staff')
    except User.DoesNotExist:
        return Response({'error': 'Invalid RFID code'}, status=status.HTTP_404_NOT_FOUND)

    try:
        attendance = StaffAttendance.objects.get(staff=user, check_out__isnull=True)
    except StaffAttendance.DoesNotExist:
        return Response({'error': 'No active check-in found'}, status=status.HTTP_400_BAD_REQUEST)

    attendance.check_out = timezone.now()
    attendance.save()
    return Response(StaffAttendanceSerializer(attendance).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_attendance_analysis_api(request, attendance_id):
    """Analyze a specific attendance record for punctuality and duration."""
    try:
        attendance = StaffAttendance.objects.get(id=attendance_id)
    except StaffAttendance.DoesNotExist:
        return Response({'error': 'Attendance record not found'}, status=status.HTTP_404_NOT_FOUND)

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
        staff = User.objects.get(id=staff_id, role='staff')
    except User.DoesNotExist:
        return Response({'error': 'Staff not found'}, status=status.HTTP_404_NOT_FOUND)

    attendances = StaffAttendance.objects.filter(staff=staff)
    if request.user.role != 'owner':
        attendances = attendances.filter(club=request.user.club)

    attendance_days = attendances.distinct('check_in__date').count()
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