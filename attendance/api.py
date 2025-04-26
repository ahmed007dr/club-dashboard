from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Attendance, EntryLog
from .serializers import AttendanceSerializer, EntryLogSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub  

# Attendance API Views
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_list_api(request):
    if request.user.role == 'owner':
        attendances = Attendance.objects.select_related('subscription', 'subscription__member').order_by('-attendance_date')  
    else:
        attendances = Attendance.objects.select_related('subscription', 'subscription__member').filter(subscription__club=request.user.club).order_by('-attendance_date')  # باقي الموظفين يشوفوا بس السجلات في ناديهم

    serializer = AttendanceSerializer(attendances, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_attendance_api(request):
    serializer = AttendanceSerializer(data=request.data)
    if serializer.is_valid():
        attendance = serializer.save()
        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, attendance):
            attendance.delete() 
            return Response({'error': 'You do not have permission to create an attendance record for this club'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_attendance_api(request, attendance_id):
    attendance = get_object_or_404(Attendance, id=attendance_id)
    attendance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# EntryLog API Views
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def entry_log_list_api(request):
    if request.user.role == 'owner':
        logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').order_by('-timestamp')  
    else:
        logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').filter(club=request.user.club).order_by('-timestamp')  # باقي الموظفين يشوفوا بس السجلات في ناديهم

    serializer = EntryLogSerializer(logs, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def create_entry_log_api(request):
    data = request.data.copy()
    data['approved_by'] = request.user.id  
    
    serializer = EntryLogSerializer(data=data)
    if serializer.is_valid():
        entry_log = serializer.save()
        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, entry_log):
            entry_log.delete()  
            return Response({'error': 'You do not have permission to create an entry log for this club'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)