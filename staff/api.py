from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Shift
from .serializers import ShiftSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub  
from .models import StaffAttendance, Shift
from .serializers import StaffAttendanceSerializer
from datetime import datetime
from django.utils import timezone

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def shift_list_api(request):
    if request.user.role == 'owner':
        shifts = Shift.objects.select_related('club', 'staff', 'approved_by').all()  
    else:
        shifts = Shift.objects.select_related('club', 'staff', 'approved_by').filter(club=request.user.club)  

    serializer = ShiftSerializer(shifts, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_shift_api(request):
    data = request.data.copy()
    if 'approved_by' not in data:
        data['approved_by'] = request.user.id  
    
    serializer = ShiftSerializer(data=data)
    if serializer.is_valid():
        shift = serializer.save()

        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, shift):
            shift.delete() 
            return Response({'error': 'You do not have permission to create a shift for this club'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def shift_detail_api(request, shift_id):
    shift = get_object_or_404(Shift, id=shift_id)

    serializer = ShiftSerializer(shift)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def edit_shift_api(request, shift_id):
    shift = get_object_or_404(Shift, id=shift_id)

    serializer = ShiftSerializer(shift, data=request.data, partial=True)
    if serializer.is_valid():
        updated_shift = serializer.save()
        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, updated_shift):
            return Response({'error': 'You do not have permission to update this shift to this club'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_shift_api(request, shift_id):
    shift = get_object_or_404(Shift, id=shift_id)

    shift.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def staff_shifts_api(request, staff_id):

    if request.user.role == 'owner':
        shifts = Shift.objects.filter(staff_id=staff_id).select_related('club', 'approved_by')  
    else:
        shifts = Shift.objects.filter(staff_id=staff_id, club=request.user.club).select_related('club', 'approved_by')  

    serializer = ShiftSerializer(shifts, many=True)
    return Response(serializer.data)


#shift empoly in and out 
def find_current_shift(user):
    now = timezone.now()
    return Shift.objects.filter(
        staff=user,
        date=now.date(),
        shift_start__lte=now.time(),
        shift_end__gte=now.time()
    ).first()

#staff check in
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def staff_check_in_api(request):
    user = request.user
    if user.role != 'staff':
        return Response({'error': 'Only staff can check in'}, status=status.HTTP_403_FORBIDDEN)

    if StaffAttendance.objects.filter(staff=user, check_out__isnull=True).exists():
        return Response({'error': 'Already checked in'}, status=status.HTTP_400_BAD_REQUEST)

    shift = find_current_shift(user)
    attendance = StaffAttendance.objects.create(staff=user, club=user.club, shift=shift)
    return Response(StaffAttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED)



#staff checkout 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def staff_check_out_api(request):
    user = request.user
    try:
        attendance = StaffAttendance.objects.get(staff=user, check_out__isnull=True)
    except StaffAttendance.DoesNotExist:
        return Response({'error': 'No active check-in found'}, status=status.HTTP_400_BAD_REQUEST)

    attendance.check_out = timezone.now()
    attendance.save()
    return Response(StaffAttendanceSerializer(attendance).data)


# report 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_attendance_analysis_api(request, attendance_id):
    try:
        attendance = StaffAttendance.objects.get(id=attendance_id)
    except StaffAttendance.DoesNotExist:
        return Response({'error': 'Attendance record not found'}, status=status.HTTP_404_NOT_FOUND)

    if not attendance.shift:
        return Response({'status': 'no_shift'})

    shift_start = datetime.combine(attendance.shift.date, attendance.shift.shift_start)
    shift_end = datetime.combine(attendance.shift.date, attendance.shift.shift_end)
    check_in = attendance.check_in
    check_out = attendance.check_out or timezone.now()

    expected = (shift_end - shift_start).total_seconds() / 3600
    actual = (check_out - check_in).total_seconds() / 3600

    late_by = max(0, (check_in - shift_start).total_seconds() / 60) if check_in > shift_start else 0
    left_early_by = max(0, (shift_end - check_out).total_seconds() / 60) if check_out < shift_end else 0

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
        "actual_hours": round(actual, 2),
        "expected_hours": round(expected, 2)
    })
