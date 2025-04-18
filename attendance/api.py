from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Attendance, EntryLog
from .serializers import AttendanceSerializer, EntryLogSerializer
from rest_framework.permissions import IsAuthenticated

# Attendance API Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_list_api(request):
    attendances = Attendance.objects.select_related('subscription', 'subscription__member').order_by('-attendance_date')
    serializer = AttendanceSerializer(attendances, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_attendance_api(request):
    serializer = AttendanceSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_attendance_api(request, attendance_id):
    attendance = get_object_or_404(Attendance, id=attendance_id)
    attendance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# EntryLog API Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def entry_log_list_api(request):
    logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').order_by('-timestamp')
    serializer = EntryLogSerializer(logs, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_entry_log_api(request):
    data = request.data.copy()
    data['approved_by'] = request.user.id  # Auto-set the current user as approved_by
    
    serializer = EntryLogSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)