from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Attendance, EntryLog
from .serializers import AttendanceSerializer, EntryLogSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub
from django.db.models import Q

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_list_api(request):
    search_term = request.GET.get('q', '')

    if request.user.role == 'owner':
        attendances = Attendance.objects.select_related('subscription', 'subscription__member')
    else:
        attendances = Attendance.objects.select_related('subscription', 'subscription__member').filter(subscription__club=request.user.club)

    if search_term:
        attendances = attendances.filter(
            Q(subscription__member__name__icontains=search_term) |
            Q(subscription__member__membership_number__icontains=search_term)
        )

    attendances = attendances.order_by('-attendance_date')

    serializer = AttendanceSerializer(attendances, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_attendance_api(request):
    serializer = AttendanceSerializer(data=request.data)
    if serializer.is_valid():
        subscription = serializer.validated_data['subscription']
        if not subscription.can_enter():
            return Response(
                {'error': 'Maximum entry limit reached for this subscription'},
                status=status.HTTP_400_BAD_REQUEST
            )
        attendance = serializer.save()
        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, attendance):
            attendance.delete()
            return Response(
                {'error': 'You do not have permission to create an attendance record for this club'},
                status=status.HTTP_403_FORBIDDEN
            )
        subscription.entry_count += 1
        subscription.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_attendance_api(request, attendance_id):
    attendance = get_object_or_404(Attendance, id=attendance_id)
    subscription = attendance.subscription
    subscription.entry_count = max(0, subscription.entry_count - 1)  # Decrease entry count
    subscription.save()
    attendance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def entry_log_list_api(request):
    search_term = request.GET.get('q', '')

    if request.user.role == 'owner':
        logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription')
    else:
        logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').filter(club=request.user.club)

    if search_term:
        logs = logs.filter(
            Q(member__name__icontains=search_term) |
            Q(member__membership_number__icontains=search_term)
        )

    logs = logs.order_by('-timestamp')

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
            return Response(
                {'error': 'You do not have permission to create an entry log for this club'},
                status=status.HTTP_403_FORBIDDEN
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)