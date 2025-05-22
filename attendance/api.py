from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Attendance, EntryLog
from .serializers import AttendanceSerializer, EntryLogSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub
from django.db.models import Q
from django.utils import timezone
from members.models import Member
from rest_framework.pagination import PageNumberPagination
from datetime import datetime



@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_list_api(request):    
    # Get query parameters
    search_term = request.GET.get('q', '')
    attendance_date = request.GET.get('attendance_date', '')
    entry_time_start = request.GET.get('entry_time_start', '')
    entry_time_end = request.GET.get('entry_time_end', '')
    rfid_code = request.GET.get('rfid_code', '')
    member_name = request.GET.get('member_name', '')

    # Base queryset based on user role
    if request.user.role == 'owner':
        attendances = Attendance.objects.select_related('subscription', 'subscription__member').all()
    else:
        attendances = Attendance.objects.select_related('subscription', 'subscription__member').filter(
            subscription__club=request.user.club
        )

    # Apply filters
    if search_term:
        attendances = attendances.filter(
            Q(subscription__member__name__icontains=search_term) |
            Q(subscription__member__phone__icontains=search_term) |
            Q(subscription__member__rfid_code__icontains=search_term)
        )

    if attendance_date:
        try:
            # Assuming attendance_date is in YYYY-MM-DD format
            parsed_date = datetime.strptime(attendance_date, '%Y-%m-%d').date()
            attendances = attendances.filter(attendance_date=parsed_date)
        except ValueError:
            # Handle invalid date format gracefully (optional)
            pass

    if entry_time_start and entry_time_end:
        try:
            # Assuming entry_time is in HH:MM:SS format
            attendances = attendances.filter(
                entry_time__range=(entry_time_start, entry_time_end)
            )
        except ValueError:
            # Handle invalid time format gracefully (optional)
            pass
    elif entry_time_start:
        try:
            attendances = attendances.filter(entry_time__gte=entry_time_start)
        except ValueError:
            pass
    elif entry_time_end:
        try:
            attendances = attendances.filter(entry_time__lte=entry_time_end)
        except ValueError:
            pass

    if rfid_code:
        attendances = attendances.filter(subscription__member__rfid_code__icontains=rfid_code)

    if member_name:
        attendances = attendances.filter(subscription__member__name__icontains=member_name)

    # Order by attendance_date (descending)
    attendances = attendances.order_by('-attendance_date')

    # Pagination
    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(attendances, request)
    serializer = AttendanceSerializer(result_page, many=True)

    return paginator.get_paginated_response(serializer.data)

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
        logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').all()
    else:
        logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').filter(club=request.user.club)

    if search_term:
        logs = logs.filter(
            Q(member__name__icontains=search_term) |
            Q(member__phone__icontains=search_term) |
            Q(member__rfid_code__icontains=search_term)
        )

    logs = logs.order_by('-timestamp')

    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(logs, request)

    serializer = EntryLogSerializer(result_page, many=True)

    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_attendance_api(request):
    
    serializer = AttendanceSerializer(data=request.data)

    if serializer.is_valid():
        attendance = serializer.save()

        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, attendance):
            attendance.delete()
            return Response(
                {'error': 'ليس لديك الصلاحية لتسجيل حضور لهذا النادي'},
                status=status.HTTP_403_FORBIDDEN
            )

        subscription = attendance.subscription

        if not subscription.can_enter():
            attendance.delete()
            return Response(
                {'error': 'لا يمكن تسجيل الحضور: تم الوصول للحد الأقصى لعدد الدخول'},
                status=status.HTTP_400_BAD_REQUEST
            )

        subscription.entry_count += 1
        subscription.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
                {'error': 'ليس لديك الصلاحية لتسجيل دخول لهذا النادي'},
                status=status.HTTP_403_FORBIDDEN
            )

        subscription = entry_log.related_subscription
        if subscription:
            if not subscription.can_enter():
                entry_log.delete()
                return Response(
                    {'error': 'لا يمكن تسجيل الدخول: تم الوصول للحد الأقصى لعدد الدخول'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            print("تم تنفيذ خطوة: لا يوجد اشتراك مرتبط بسجل الدخول")

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)