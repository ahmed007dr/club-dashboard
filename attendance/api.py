import logging
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models.functions import ExtractHour
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from utils.permissions import IsOwnerOrRelatedToClub
from .models import Attendance, EntryLog
from members.models import Member
from .serializers import AttendanceSerializer, EntryLogSerializer
from django.db.models import Case, When, F, BooleanField,Q,Count

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_heatmap_api(request):
    """Get heatmap data for club attendance."""
    attendances = Attendance.objects.select_related('subscription').filter(
        subscription__club=request.user.club
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
    """Get heatmap data for a specific member's attendance."""
    member_id = request.query_params.get('member_id')
    if not member_id:
        logger.error('Member ID is required for member attendance heatmap')
        return Response({'error': 'Member ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    attendances = Attendance.objects.select_related('subscription').filter(
        subscription__member_id=member_id,
        subscription__club=request.user.club
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
def attendance_list_api(request):
    """Get paginated list of attendances with optional filters."""
    rfid = request.GET.get('rfid', '')
    attendance_date = request.GET.get('attendance_date', '')
    member_name = request.GET.get('member_name', '')
    page_size = request.GET.get('page_size', 20)

    attendances = Attendance.objects.select_related('subscription', 'subscription__member').filter(
        subscription__club=request.user.club
    )

    is_search_mode = rfid or member_name
    if not is_search_mode and not attendance_date:
        start_date = timezone.now().date() - timedelta(days=2)
        attendances = attendances.filter(attendance_date__gte=start_date)

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


    attendances = attendances.order_by('-attendance_date', '-entry_time')

    paginator = PageNumberPagination()
    paginator.page_size = page_size
    result_page = paginator.paginate_queryset(attendances, request)
    serializer = AttendanceSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_attendance_api(request, attendance_id):
    """Delete an attendance record (Owner/Admin only)."""
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'غير مسموح بالوصول. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)

    attendance = get_object_or_404(Attendance, id=attendance_id)
    subscription = attendance.subscription
    subscription.entry_count = max(0, subscription.entry_count - 1)
    subscription.save()
    attendance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_attendance_api(request):
    """Create a new attendance record with rate limiting per member."""
    serializer = AttendanceSerializer(data=request.data)
    if serializer.is_valid():
        # Get identifier from request data
        identifier = serializer.validated_data.get('identifier')
        if not identifier:
            logger.error("Missing 'identifier' in request data")
            return Response(
                {'error': 'حقل identifier مطلوب'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find member using identifier
        try:
            member = Member.objects.get(Q(rfid_code=identifier) | Q(phone=identifier))
        except Member.DoesNotExist:
            logger.error(f"No member found for identifier {identifier}")
            return Response(
                {'error': 'لم يتم العثور على عضو بالـ RFID أو رقم الهاتف المقدم'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check rate limit per member
        now = timezone.now()
        one_minute_ago = now - timedelta(seconds=60)
        recent_count = Attendance.objects.filter(
            subscription__member_id=member.id,
            entry_time__gte=one_minute_ago,
            entry_time__lte=now
        ).count()
        
        if recent_count >= 1:
            logger.warning(f"Rate limit exceeded for member {member.id}")
            return Response(
                {'error': 'تم تجاوز الحد الأقصى لتسجيل الدخول: مرة واحدة في الدقيقة لكل عضو'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Create attendance
        attendance = serializer.save()
        subscription = attendance.subscription
        if not subscription.can_enter:
            attendance.delete()
            if not subscription.type.is_active:
                return Response({'error': 'لا يمكن تسجيل الحضور: نوع الاشتراك غير نشط'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': 'لا يمكن تسجيل الحضور: الاشتراك غير نشط أو تم الوصول للحد الأقصى لعدد الدخول'}, status=status.HTTP_400_BAD_REQUEST)
        subscription.entry_count += 1
        subscription.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_last_hour_api(request):
    """Get the count of attendances for the last 60 minutes."""
    now = timezone.now()
    one_hour_ago = now - timedelta(hours=1)
    
    # تحديد تاريخ اليوم لضمان عدم عد السجلات من أيام سابقة
    today = now.date()
    
    attendances = Attendance.objects.filter(
        subscription__club=request.user.club,
        attendance_date=today,  # التحقق من تاريخ الحضور
        entry_time__gte=one_hour_ago.time(),  # وقت الدخول في آخر ساعة
        entry_time__lte=now.time()  # وقت الدخول حتى الآن
    )
    
    count = attendances.count()
    return Response({"count": count}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_hourly_api(request):
    """Get hourly attendance data for a specific day."""
    date_str = request.GET.get('date', timezone.now().date().isoformat())
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        logger.error(f"Invalid date format: {date_str}")
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

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
    """Get daily attendance data for the last 7 days."""
    today = timezone.now().date()
    end_date = today
    while end_date.weekday() != 4:
        end_date -= timedelta(days=1)
    start_date = end_date - timedelta(days=6)
    week_days = [start_date + timedelta(days=i) for i in range(7)]

    attendances = Attendance.objects.filter(
        subscription__club=request.user.club,
        attendance_date__gte=start_date,
        attendance_date__lte=end_date
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
    """Get daily attendance data for the last 30 days."""
    today = timezone.now().date()
    start_date = today - timedelta(days=29)
    days = [start_date + timedelta(days=i) for i in range(30)]

    attendances = Attendance.objects.filter(
        subscription__club=request.user.club,
        attendance_date__gte=start_date,
        attendance_date__lte=today
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
    page_size = request.GET.get('page_size', 20)

    logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').filter(
        club=request.user.club
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
        subscription = entry_log.related_subscription
        if subscription and not subscription.can_enter():
            entry_log.delete()
            return Response(
                {'error': 'لا يمكن تسجيل الدخول: تم الوصول للحد الأقصى لعدد الدخول'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
