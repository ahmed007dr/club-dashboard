from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Attendance, EntryLog
from .serializers import AttendanceSerializer, EntryLogSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from datetime import datetime, timedelta
from django.db.models import Count
from staff.models import StaffAttendance


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def attendance_heatmap_api(request):
    one_year_ago = timezone.now().date() - timedelta(days=365)
    
    if request.user.role in ['owner', 'admin']:
        attendances = Attendance.objects.filter(
            attendance_date__gte=one_year_ago,
            subscription__club=request.user.club
        )
    else:
        # Reception and Accountant see only their shift's attendances
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club
        ).order_by('-check_in').first()
        
        if not attendance:
            return Response({'error': 'No open or recent shift found.'}, status=status.HTTP_404_NOT_FOUND)
        
        check_out = attendance.check_out if attendance.check_out else timezone.now()
        attendances = Attendance.objects.filter(
            subscription__club=request.user.club,
            approved_by=request.user,
            attendance_date__range=(attendance.check_in, check_out),
            attendance_date__gte=one_year_ago
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
    rfid = request.GET.get('rfid', '')
    attendance_date = request.GET.get('attendance_date', '')
    member_name = request.GET.get('member_name', '')
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 20)

    # Determine if search mode is active
    is_search_mode = rfid or member_name

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
            # Default mode: only show attendances from their shift
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club
            ).order_by('-check_in').first()
            
            if not attendance:
                return Response({'error': 'No open or recent shift found.'}, status=status.HTTP_404_NOT_FOUND)
            
            check_out = attendance.check_out if attendance.check_out else timezone.now()
            attendances = Attendance.objects.select_related('subscription', 'subscription__member').filter(
                subscription__club=request.user.club,
                approved_by=request.user,
                attendance_date__range=(attendance.check_in, check_out)
            )

    if rfid:
        attendances = attendances.filter(subscription__member__rfid_code__iexact=rfid)
    
    if attendance_date:
        try:
            date_obj = datetime.strptime(attendance_date, '%Y-%m-%d').date()
            if request.user.role not in ['owner', 'admin'] and not is_search_mode:
                if date_obj < attendance.check_in.date() or date_obj > check_out.date():
                    return Response({'error': 'Date must be within your shift.'}, status=status.HTTP_400_BAD_REQUEST)
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

    # Return the paginated response with serializer.data directly
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
    # Get filters from query parameters
    club = request.GET.get('club', '')
    rfid = request.GET.get('rfid', '')
    member = request.GET.get('member', '')
    timestamp = request.GET.get('timestamp', '')
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 20)

    # Base queryset
    if request.user.role == 'owner':
        logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').all()
    else:
        logs = EntryLog.objects.select_related('club', 'member', 'approved_by', 'related_subscription').filter(club=request.user.club)

    # Apply filters
    if club:
        logs = logs.filter(club__name__icontains=club)
    
    if rfid:
        logs = logs.filter(member__rfid_code__iexact=rfid)
    
    if member:
        logs = logs.filter(member__name__icontains=member)
    
    if timestamp:
        try:
            # Parse date using datetime module
            date_obj = datetime.strptime(timestamp, '%Y-%m-%d').date()
            logs = logs.filter(timestamp__date=date_obj)
        except ValueError:
            pass

    # Ordering and pagination
    logs = logs.order_by('-timestamp')
    paginator = PageNumberPagination()
    paginator.page_size = page_size
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