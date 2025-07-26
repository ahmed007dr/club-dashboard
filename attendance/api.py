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
from .models import Attendance, EntryLog
from members.models import Member
from .serializers import AttendanceSerializer, EntryLogSerializer
from django.db.models import Case, When, F, BooleanField, Q, Count
from django.utils.dateparse import parse_datetime
from staff.models import StaffAttendance
from subscriptions.models import Subscription
logger = logging.getLogger(__name__)

FULL_ACCESS_ROLES = ['owner', 'admin']

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_heatmap_api(request):
    """Get heatmap data for club attendance."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    attendances = Attendance.objects.select_related('subscription').filter(
        subscription__club=request.user.club
    )
    daily_counts = (
        attendances
        .values('timestamp__date')
        .annotate(count=Count('id'))
        .order_by('timestamp__date')
    )
    heatmap_data = [
        {'date': entry['timestamp__date'].isoformat(), 'count': entry['count']}
        for entry in daily_counts
        if entry['timestamp__date'] is not None  # تخطي السجلات التي تحتوي على None
    ]
    return Response(heatmap_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def member_attendance_heatmap_api(request):
    """Get heatmap data for a specific member's attendance."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
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
        .values('timestamp__date')
        .annotate(count=Count('id'))
        .order_by('timestamp__date')
    )
    heatmap_data = [
        {'date': entry['timestamp__date'].isoformat(), 'count': entry['count']}
        for entry in daily_counts
    ]
    return Response(heatmap_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_list_api(request):
    """List attendance records with pagination and filtering."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)

    # Get query parameters
    page = request.query_params.get('page', 1)
    page_size = request.query_params.get('page_size', 20)
    member_name = request.query_params.get('member_name', '')
    timestamp = request.query_params.get('timestamp', '')

    try:
        page = int(page)
        page_size = int(page_size)
    except ValueError:
        logger.error(f"Invalid page or page_size: {page}, {page_size}")
        return Response({'error': 'رقم الصفحة أو حجم الصفحة غير صالح.'}, status=status.HTTP_400_BAD_REQUEST)

    # Build queryset
    queryset = Attendance.objects.filter(subscription__club=request.user.club)

    if request.user.role != 'owner':
        queryset = queryset.filter(subscription__club=request.user.club)

    if member_name:
        queryset = queryset.filter(subscription__member__name__icontains=member_name)

    if timestamp:
        try:
            date = timezone.datetime.strptime(timestamp, '%Y-%m-%d').date()
            queryset = queryset.filter(timestamp__date=date)
        except ValueError:
            logger.error(f"Invalid timestamp format: {timestamp}")
            return Response({'error': 'صيغة التاريخ غير صالحة.'}, status=status.HTTP_400_BAD_REQUEST)

    # Sort by timestamp in descending order
    queryset = queryset.order_by('-timestamp')

    # Pagination
    paginator = PageNumberPagination()
    paginator.page_size = page_size
    paginated_queryset = paginator.paginate_queryset(queryset, request)

    # Serialize data
    serializer = AttendanceSerializer(paginated_queryset, many=True)
    response_data = {
        'count': paginator.page.paginator.count,
        'results': serializer.data
    }
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_attendance_api(request, attendance_id):
    """Delete an attendance record (Owner/Admin only)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.user.role not in FULL_ACCESS_ROLES:
        return Response({'error': 'غير مسموح بالحذف. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)

    attendance = get_object_or_404(Attendance, id=attendance_id)
    subscription = attendance.subscription
    subscription.entry_count = max(0, subscription.entry_count - 1)
    subscription.save()
    attendance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_attendance_api(request):
    """Create a new attendance record with rate limiting per member."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = AttendanceSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        identifier = serializer.validated_data.get('identifier')
        subscription_id = serializer.validated_data.get('subscription_id')
        
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
        one_minute_ago = now - timedelta(seconds=5)
        recent_count = Attendance.objects.filter(
            subscription__member_id=member.id,
            timestamp__gte=one_minute_ago,
            timestamp__lte=now
        ).count()
        
        if recent_count >= 1:
            logger.warning(f"Rate limit exceeded for member {member.id}")
            return Response(
                {'error': 'تم تجاوز الحد الأقصى لتسجيل الدخول: مرة واحدة في الدقيقة لكل عضو'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Get active subscriptions
        today = timezone.now().date()
        active_subscriptions = Subscription.objects.filter(
            member=member,
            club=request.user.club,
            start_date__lte=today,
            end_date__gte=today,
            type__is_active=True,
            is_cancelled=False
        ).annotate(
            can_enter=Case(
                When(type__max_entries=0, then=True),
                When(entry_count__lt=F('type__max_entries'), then=True),
                default=False,
                output_field=BooleanField()
            )
        ).filter(can_enter=True)
        
        if not active_subscriptions.exists():
            logger.error(f"No active subscriptions for member {member.id}")
            return Response(
                {'error': 'لا يوجد اشتراكات نشطة لهذا العضو'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Select subscription
        if subscription_id:
            subscription = active_subscriptions.filter(id=subscription_id).first()
            if not subscription:
                logger.error(f"Invalid subscription_id {subscription_id} for member {member.id}")
                return Response(
                    {'error': 'الاشتراك المحدد غير نشط أو غير موجود'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            subscription = active_subscriptions.first()
        
        # Create attendance
        attendance = serializer.save(subscription=subscription)
        if not subscription.can_enter:
            attendance.delete()
            logger.error(f"Cannot record attendance for subscription {subscription.id}: not active or max entries reached")
            if not subscription.type.is_active:
                return Response({'error': 'لا يمكن تسجيل الحضور: نوع الاشتراك غير نشط'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': 'لا يمكن تسجيل الحضور: الاشتراك غير نشط أو تم الوصول للحد الأقصى لعدد الدخول'}, status=status.HTTP_400_BAD_REQUEST)
        
        subscription.entry_count += 1
        subscription.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_last_hour_api(request):
    """Get the count of attendances for the last 60 minutes."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    now = timezone.now()
    one_hour_ago = now - timedelta(hours=1)
    
    attendances = Attendance.objects.filter(
        subscription__club=request.user.club,
        timestamp__gte=one_hour_ago,
        timestamp__lte=now
    )
    
    count = attendances.count()
    return Response({"count": count}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_hourly_api(request):
    """Get hourly attendance data for a specific day."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    date_str = request.GET.get('date', timezone.now().date().isoformat())
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        logger.error(f"Invalid date format: {date_str}")
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    attendances = Attendance.objects.filter(
        subscription__club=request.user.club,
        timestamp__date=target_date
    )
    hourly_counts = (
        attendances
        .annotate(hour=ExtractHour('timestamp'))
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
@permission_classes([IsAuthenticated])
def attendance_weekly_api(request):
    """Get daily attendance data for the last 7 days."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    today = timezone.now().date()
    end_date = today
    while end_date.weekday() != 4:  # الجمعة (نهاية الأسبوع)
        end_date -= timedelta(days=1)
    start_date = end_date - timedelta(days=6)
    week_days = [start_date + timedelta(days=i) for i in range(7)]

    attendances = Attendance.objects.filter(
        subscription__club=request.user.club,
        timestamp__date__gte=start_date,
        timestamp__date__lte=end_date
    )
    daily_counts = (
        attendances
        .values('timestamp__date')
        .annotate(count=Count('id'))
        .order_by('timestamp__date')
    )
    daily_data = [{'date': date.isoformat(), 'count': 0} for date in week_days]
    for entry in daily_counts:
        date_str = entry['timestamp__date'].isoformat()
        for data in daily_data:
            if data['date'] == date_str:
                data['count'] = entry['count']
                break
    return Response(daily_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_monthly_api(request):
    """Get daily attendance data for the last 30 days."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    today = timezone.now().date()
    start_date = today - timedelta(days=29)
    days = [start_date + timedelta(days=i) for i in range(30)]

    attendances = Attendance.objects.filter(
        subscription__club=request.user.club,
        timestamp__date__gte=start_date,
        timestamp__date__lte=today
    )
    daily_counts = (
        attendances
        .values('timestamp__date')
        .annotate(count=Count('id'))
        .order_by('timestamp__date')
    )
    daily_data = [{'date': date.isoformat(), 'count': 0} for date in days]
    for entry in daily_counts:
        date_str = entry['timestamp__date'].isoformat()
        for data in daily_data:
            if data['date'] == date_str:
                data['count'] = entry['count']
                break
    return Response(daily_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def entry_log_list_api(request):
    """Get paginated list of entry logs with optional filters."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
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
@permission_classes([IsAuthenticated])
def create_entry_log_api(request):
    """Create a new entry log record."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
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