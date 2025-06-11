import logging
from datetime import datetime, timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count
from django.db.models.functions import ExtractHour

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from utils.permissions import IsOwnerOrRelatedToClub

from .models import Attendance, EntryLog
from .serializers import AttendanceSerializer, EntryLogSerializer
from staff.models import StaffAttendance

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_heatmap_api(request):
    """Get heatmap data for club attendance over the past year."""
    one_year_ago = timezone.now().date() - timedelta(days=365)
    
    if request.user.role in ['owner', 'admin']:
        attendances = Attendance.objects.filter(
            subscription__club=request.user.club,
            attendance_date__gte=one_year_ago
        )
    else:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()
        
        if not attendance:
            return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)
        
        effective_start = max(attendance.check_in.date(), one_year_ago)
        attendances = Attendance.objects.filter(
            subscription__club=request.user.club,
            approved_by=request.user,
            attendance_date__gte=effective_start,
            attendance_date__lte=timezone.now()
        )

    daily_counts = (
        attendances
        .values('attendance_date')
        .annotate(count=Count('id'))
        .order_by('attendance_date')
    )

    heatmap_data = [
        {'date': entry['attendance_date'].isoformat(), 'count': entry['count']}
        for entry in daily_counts
    ]

    return Response(heatmap_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def member_attendance_heatmap_api(request):
    """Get heatmap data for a specific member's attendance over the past year."""
    member_id = request.query_params.get('member_id')
    if not member_id:
        logger.error('Member ID is required for member attendance heatmap')
        return Response({'error': 'Member ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    one_year_ago = timezone.now().date() - timedelta(days=365)

    if request.user.role in ['owner', 'admin']:
        attendances = Attendance.objects.filter(
            subscription__member_id=member_id,
            subscription__club=request.user.club,
            attendance_date__gte=one_year_ago
        )
    else:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()
        
        if not attendance:
            logger.error('No open shift found for user')
            return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)
        
        effective_start = max(attendance.check_in.date(), one_year_ago)
        attendances = Attendance.objects.filter(
            subscription__member_id=member_id,
            subscription__club=request.user.club,
            approved_by=request.user,
            attendance_date__gte=effective_start,
            attendance_date__lte=timezone.now()
        )

    logger.info(f'Found {attendances.count()} attendance records for member ID {member_id}')

    daily_counts = (
        attendances
        .values('attendance_date')
        .annotate(count=Count('id'))
        .order_by('attendance_date')
    )

    heatmap_data = [
        {'date': entry['attendance_date'].isoformat(), 'count': entry['count']}
        for entry in daily_counts
    ]

    return Response(heatmap_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_list_api(request):
    """Get paginated list of attendances with optional filters."""
    rfid = request.GET.get('rfid', '')
    attendance_date = request.GET.get('attendance_date', '')
    member_name = request.GET.get('member_name', '')
    page_size = request.GET.get('page_size', 20)

    is_search_mode = rfid or member_name or attendance_date

    if request.user.role in ['owner', 'admin']:
        attendances = Attendance.objects.select_related('subscription', 'subscription__member').filter(
            subscription__club=request.user.club
        )
    else:
        if is_search_mode:
            attendances = Attendance.objects.select_related('subscription', 'subscription__member').filter(
                subscription__club=request.user.club
            )
        else:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True
            ).order_by('-check_in').first()

            if not attendance:
                return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

            attendances = Attendance.objects.select_related('subscription', 'subscription__member').filter(
                subscription__club=request.user.club,
                approved_by=request.user,
                attendance_date__gte=attendance.check_in,
                attendance_date__lte=timezone.now()
            )

    if rfid:
        attendances = attendances.filter(subscription__member__rfid_code__iexact=rfid)

    if attendance_date:
        try:
            date_obj = datetime.strptime(attendance_date, '%Y-%m-%d').date()
            attendances = attendances.filter(attendance_date=date_obj)
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    if member_name:
        attendances = attendances.filter(subscription__member__name__icontains=member_name)

    attendances = attendances.order_by('-attendance_date')
    paginator = PageNumberPagination()
    paginator.page_size = page_size
    result_page = paginator.paginate_queryset(attendances, request)

    serializer = AttendanceSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_attendance_api(request, attendance_id):    
    """Delete an attendance record and update subscription entry count."""
    attendance = get_object_or_404(Attendance, id=attendance_id)

    subscription = attendance.subscription
    subscription.entry_count = max(0, subscription.entry_count - 1)
    subscription.save()

    attendance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_attendance_api(request):
    serializer = AttendanceSerializer(data=request.data)
    if serializer.is_valid():
        attendance = serializer.save()
        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, attendance):
            attendance.delete()
            return Response({'error': 'ليس لديك الصلاحية لتسجيل حضور لهذا النادي'}, status=status.HTTP_403_FORBIDDEN)
        subscription = attendance.subscription
        if not subscription.can_enter():
            attendance.delete()
            if subscription.start_date > timezone.now().date() or subscription.end_date < timezone.now().date():
                return Response({'error': 'لا يمكن تسجيل الحضور: الاشتراك غير نشط'}, status=status.HTTP_400_BAD_REQUEST)
            if not subscription.type.is_active:
                return Response({'error': 'لا يمكن تسجيل الحضور: نوع الاشتراك غير نشط'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': 'لا يمكن تسجيل الحضور: تم الوصول للحد الأقصى لعدد الدخول'}, status=status.HTTP_400_BAD_REQUEST)
        subscription.entry_count += 1
        subscription.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_hourly_api(request):
    """Get hourly attendance data for a specific day (default: today)."""
    logger.info(f"Request params: {request.GET}")
    logger.info(f"User: {request.user}, Role: {request.user.role}, Club: {request.user.club}")

    if not hasattr(request.user, 'club') or not request.user.club:
        logger.error('User has no associated club')
        return Response({'error': 'User has no associated club.'}, status=status.HTTP_403_FORBIDDEN)

    date_str = request.GET.get('date', timezone.now().date().isoformat())
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        logger.error(f"Invalid date format: {date_str}")
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.user.role in ['owner', 'admin']:
        attendances = Attendance.objects.filter(
            subscription__club=request.user.club,
            attendance_date=target_date
        )
    else:
        staff_attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club
        ).order_by('-check_in').first()
        if not staff_attendance:
            logger.error('No open or recent shift found for user')
            return Response({'error': 'No open or recent shift found.'}, status=status.HTTP_404_NOT_FOUND)
        
        check_out = staff_attendance.check_out if staff_attendance.check_out else timezone.now()
        if target_date < staff_attendance.check_in.date() or target_date > check_out.date():
            logger.error(f"Date {target_date} is outside user's shift")
            return Response({'error': 'Date must be within your shift.'}, status=status.HTTP_400_BAD_REQUEST)
        
        attendances = Attendance.objects.filter(
            subscription__club=request.user.club,
            attendance_date=target_date
        )

    hourly_counts = (
        attendances
        .filter(entry_time__isnull=False)
        .annotate(hour=ExtractHour('entry_time'))
        .values('hour')
        .annotate(count=Count('id'))
        .order_by('hour')
    )

    hourly_data = [0] * 24
    for entry in hourly_counts:
        hour = entry['hour']
        hourly_data[hour] = entry['count']

    return Response(hourly_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_weekly_api(request):
    """Get daily attendance data for the last 7 days (Saturday to Friday)."""
    today = timezone.now().date()
    end_date = today
    while end_date.weekday() != 4:
        end_date -= timedelta(days=1)
    start_date = end_date - timedelta(days=6)
    week_days = [start_date + timedelta(days=i) for i in range(7)]

    if request.user.role in ['owner', 'admin']:
        attendances = Attendance.objects.filter(
            subscription__club=request.user.club,
            attendance_date__gte=start_date,
            attendance_date__lte=end_date
        )
    else:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club
        ).order_by('-check_in').first()
        if not attendance:
            return Response({'error': 'No open or recent shift found.'}, status=status.HTTP_404_NOT_FOUND)
        check_out = attendance.check_out if attendance.check_out else timezone.now()
        effective_start = max(start_date, attendance.check_in.date())
        effective_end = min(end_date, check_out.date())
        attendances = Attendance.objects.filter(
            subscription__club=request.user.club,
            approved_by=request.user,
            attendance_date__gte=effective_start,
            attendance_date__lte=effective_end
        )

    daily_counts = (
        attendances
        .values('attendance_date')
        .annotate(count=Count('id'))
        .order_by('attendance_date')
    )

    daily_data = [{'date': date.isoformat(), 'count': 0} for date in week_days]
    for entry in daily_counts:
        date_str = entry['attendance_date'].isoformat()
        for data in daily_data:
            if data['date'] == date_str:
                data['count'] = entry['count']
                break

    return Response(daily_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_monthly_api(request):
    """Get daily attendance data for the last 30 consecutive days."""
    today = timezone.now().date()
    start_date = today - timedelta(days=29)
    days = [start_date + timedelta(days=i) for i in range(30)]

    if request.user.role in ['owner', 'admin']:
        attendances = Attendance.objects.filter(
            subscription__club=request.user.club,
            attendance_date__gte=start_date,
            attendance_date__lte=today
        )
    else:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club
        ).order_by('-check_in').first()
        if not attendance:
            return Response({'error': 'No open or recent shift found.'}, status=status.HTTP_404_NOT_FOUND)
        check_out = attendance.check_out if attendance.check_out else timezone.now()
        effective_start = max(start_date, attendance.check_in.date())
        effective_end = min(today, check_out.date())
        attendances = Attendance.objects.filter(
            subscription__club=request.user.club,
            approved_by=request.user,
            attendance_date__gte=effective_start,
            attendance_date__lte=effective_end
        )

    daily_counts = (
        attendances
        .values('attendance_date')
        .annotate(count=Count('id'))
        .order_by('attendance_date')
    )

    daily_data = [{'date': date.isoformat(), 'count': 0} for date in days]
    for entry in daily_counts:
        date_str = entry['attendance_date'].isoformat()
        for data in daily_data:
            if data['date'] == date_str:
                data['count'] = entry['count']
                break

    return Response(daily_data)



@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def entry_log_list_api(request):    
    """Get paginated list of entry logs with optional filters."""
    club = request.GET.get('club', '')
    rfid = request.GET.get('rfid', '')
    member = request.GET.get('member', '')
    timestamp = request.GET.get('timestamp', '')
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 20)

    is_search_mode = club or rfid or member or timestamp

    if request.user.role in ['owner', 'admin']:
        logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').filter(
            club=request.user.club
        )
    else:
        if is_search_mode:
            logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').filter(
                club=request.user.club
            )
        else:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True
            ).order_by('-check_in').first()

            if not attendance:
                return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

            logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').filter(
                club=request.user.club,
                approved_by=request.user,
                timestamp__gte=attendance.check_in,
                timestamp__lte=timezone.now()
            )

    if club:
        logs = logs.filter(club__name__icontains=club)
    if rfid:
        logs = logs.filter(member__rfid_code__iexact=rfid)
    if member:
        logs = logs.filter(member__name__icontains=member)
    if timestamp:
        try:
            date_obj = datetime.strptime(timestamp, '%Y-%m-%d').date()
            logs = logs.filter(timestamp__date=date_obj)
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    logs = logs.order_by('-timestamp')
    paginator = PageNumberPagination()
    paginator.page_size = page_size
    result_page = paginator.paginate_queryset(logs, request)
    serializer = EntryLogSerializer(result_page, many=True)

    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def create_entry_log_api(request):
    """Create a new entry log record."""
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
            logger.info('No subscription linked to entry log')

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
