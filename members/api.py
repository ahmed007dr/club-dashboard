from datetime import timedelta
from django.db import IntegrityError
from django.db.models import Exists, OuterRef, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Member
from subscriptions.models import Subscription
from .serializers import MemberSerializer
from attendance.models import Attendance
from utils.generate_membership_number import generate_membership_number
import logging
from staff.models import StaffAttendance

logger = logging.getLogger(__name__)

FULL_ACCESS_ROLES = ['owner', 'admin']

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def member_list_api(request):
    """List members with optional search, showing only members added in last 24 hours by default."""
    if not request.user.club:
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=403)

    search_term = request.GET.get('q', '').strip()
    members = Member.objects.filter(club=request.user.club)

    if request.user.role not in ['owner', 'admin'] and not search_term:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'لا توجد وردية مفتوحة.'}, status=403)

        now = timezone.now()
        one_hour_ago = now - timedelta(hours=1)
        today = now.date()

        checked_in_subscription_ids = Attendance.objects.filter(
            subscription__club=request.user.club,
            attendance_date=today,
            entry_time__gte=one_hour_ago.time()
        ).values_list('subscription_id', flat=True)

        checked_in_member_ids = Subscription.objects.filter(
            id__in=checked_in_subscription_ids
        ).values_list('member_id', flat=True)

        created_member_ids = members.filter(
            created_at__gte=attendance.check_in,
            created_at__lte=attendance.check_out or now
        ).values_list('id', flat=True)

        allowed_member_ids = set(checked_in_member_ids) | set(created_member_ids)
        members = members.filter(id__in=allowed_member_ids)

    elif not search_term:
        last_24_hours = timezone.now() - timedelta(hours=24)
        members = members.filter(created_at__gte=last_24_hours)

    if search_term:
        members = members.filter(
            Q(name__icontains=search_term) |
            Q(phone__icontains=search_term) |
            Q(rfid_code__icontains=search_term)
        )

    members = members.order_by('-id')
    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(members, request)
    serializer = MemberSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def member_detail_api(request, member_id):
    """Retrieve a member's details."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    member = get_object_or_404(Member, id=member_id, club=request.user.club)
    serializer = MemberSerializer(member)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def member_search_api(request):
    """Search members by various criteria."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    search_term = request.GET.get('q', '')
    search_filter = (
        Q(name__icontains=search_term) |
        Q(membership_number__icontains=search_term) |
        Q(national_id__icontains=search_term) |
        Q(rfid_code__icontains=search_term) |
        Q(phone__icontains=search_term)
    )

    members = Member.objects.filter(
        Q(club=request.user.club) & search_filter
    ).order_by('-name')

    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(members, request)
    serializer = MemberSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user_profile(request):
    """Retrieve the authenticated user's profile."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    user = request.user
    profile_data = {
        'username': user.username,
        'email': user.email,
    }
    return Response(profile_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_member_api(request):
    """Create a new member."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    data = request.data
    mutable_data = {}
    for key in data:
        if key != 'photo':
            mutable_data[key] = data[key]
    mutable_data['membership_number'] = generate_membership_number()
    mutable_data['club'] = request.user.club.id

    serializer = MemberSerializer(data=mutable_data, context={'request': request})
    if serializer.is_valid():
        try:
            member = serializer.save()
            if 'photo' in request.FILES:
                member.photo = request.FILES['photo']
                member.save()
            logger.info(f"Member created: {member.id}, {member.name}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except IntegrityError as e:
            logger.error(f"IntegrityError creating member: {str(e)}")
            return Response(
                {'error': 'Membership number or RFID code already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error creating member: {str(e)}")
            return Response(
                {'error': f'Error creating member: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    logger.error(f"Serializer errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_member_api(request, member_id):
    """Update a member's details (Owner/Admin only)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.user.role not in FULL_ACCESS_ROLES:
        return Response(
            {'error': 'غير مسموح بالتعديل. يجب أن تكون Owner أو Admin.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    member = get_object_or_404(Member, pk=member_id, club=request.user.club)
    data = request.data.copy()
    serializer = MemberSerializer(member, data=data, partial=True, context={'request': request})
    if serializer.is_valid():
        try:
            updated_member = serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error updating member {member_id}: {str(e)}")
            return Response(
                {'error': f'Error updating member: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    logger.error(f"Serializer errors for member {member_id}: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_member_api(request, member_id):
    """Delete a member (Owner/Admin only)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.user.role not in FULL_ACCESS_ROLES:
        return Response({'error': 'غير مسموح بالحذف. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    
    member = get_object_or_404(Member, id=member_id, club=request.user.club)
    member.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def member_subscription_report_api(request):
    """Get member subscription report."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        club_id = request.user.club.id
        try:
            expiry_days = int(request.GET.get('days', 7))
            inactive_days = int(request.GET.get('inactive_days', 7))
            name = request.GET.get('name')
            rfid_code = request.GET.get('rfid_code')
            subscription_status = request.GET.get('subscription_status')
            if expiry_days < 1 or inactive_days < 1:
                raise ValueError
        except ValueError:
            return Response({'error': 'يجب أن تكون أيام الانتهاء وعدم الحضور قيمًا صحيحة وموجبة'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        expiry_threshold = today + timedelta(days=expiry_days)
        inactive_threshold = today - timedelta(days=inactive_days)

        base_query = Member.objects.filter(club_id=club_id)
        
        if name:
            base_query = base_query.filter(name__icontains=name)
        if rfid_code:
            base_query = base_query.filter(rfid_code__icontains=rfid_code)

        members_without_subscriptions = base_query.annotate(
            has_subscription=Exists(Subscription.objects.filter(member=OuterRef('pk')))
        ).filter(has_subscription=False)
        
        members_with_expired_subscriptions = base_query.filter(
            subscription__isnull=False,
            subscription__end_date__lt=today
        ).distinct()
        
        members_with_near_expiry = base_query.filter(
            subscription__end_date__gte=today,
            subscription__end_date__lte=expiry_threshold
        ).distinct()
        
        members_inactive = base_query.filter(
            subscription__end_date__gte=today
        ).exclude(
            subscription__attendance_attendances__attendance_date__gt=inactive_threshold
        ).distinct()

        if subscription_status:
            if subscription_status == 'without_subscriptions':
                members_without_subscriptions = members_without_subscriptions
                members_with_expired_subscriptions = members_with_expired_subscriptions.none()
                members_with_near_expiry = members_with_near_expiry.none()
                members_inactive = members_inactive.none()
            elif subscription_status == 'expired_subscriptions':
                members_without_subscriptions = members_without_subscriptions.none()
                members_with_expired_subscriptions = members_with_expired_subscriptions
                members_with_near_expiry = members_with_near_expiry.none()
                members_inactive = members_inactive.none()
            elif subscription_status == 'near_expiry_subscriptions':
                members_without_subscriptions = members_without_subscriptions.none()
                members_with_expired_subscriptions = members_with_expired_subscriptions.none()
                members_with_near_expiry = members_with_near_expiry
                members_inactive = members_inactive.none()
            elif subscription_status == 'inactive_members':
                members_without_subscriptions = members_without_subscriptions.none()
                members_with_expired_subscriptions = members_with_expired_subscriptions.none()
                members_with_near_expiry = members_with_near_expiry.none()
                members_inactive = members_inactive

        paginator = PageNumberPagination()
        paginator.page_size = 20

        serializer_without = MemberSerializer(paginator.paginate_queryset(members_without_subscriptions, request), many=True)
        serializer_expired = MemberSerializer(paginator.paginate_queryset(members_with_expired_subscriptions, request), many=True)
        serializer_near_expiry = MemberSerializer(paginator.paginate_queryset(members_with_near_expiry, request), many=True)
        serializer_inactive = MemberSerializer(paginator.paginate_queryset(members_inactive, request), many=True)

        response_data = {
            'without_subscriptions': {
                'count': members_without_subscriptions.count(),
                'results': serializer_without.data,
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
            },
            'expired_subscriptions': {
                'count': members_with_expired_subscriptions.count(),
                'results': serializer_expired.data,
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
            },
            'near_expiry_subscriptions': {
                'count': members_with_near_expiry.count(),
                'results': serializer_near_expiry.data,
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
            },
            'inactive_members': {
                'count': members_inactive.count(),
                'results': serializer_inactive.data,
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
            },
            'days': expiry_days,
            'inactive_days': inactive_days,
        }

        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in member_subscription_report_api: {str(e)}")
        return Response({'error': f'خطأ داخلي: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_subscription_report_api(request):
    """Export member subscription report."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        club_id = request.user.club.id
        expiry_days = int(request.GET.get('days', 7))
        inactive_days = int(request.GET.get('inactive_days', 7))
        if expiry_days < 1 or inactive_days < 1:
            return Response({'error': 'يجب أن تكون أيام الانتهاء وعدم الحضور قيمًا صحيحة وموجبة'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        expiry_threshold = today + timedelta(days=expiry_days)
        inactive_threshold = today - timedelta(days=inactive_days)

        base_query = Member.objects.filter(club_id=club_id)

        members_without_subscriptions = base_query.annotate(
            has_subscription=Exists(Subscription.objects.filter(member=OuterRef('pk')))
        ).filter(has_subscription=False)
        
        members_with_expired_subscriptions = base_query.filter(
            subscription__isnull=False,
            subscription__end_date__lt=today
        ).distinct()
        
        members_with_near_expiry = base_query.filter(
            subscription__end_date__gte=today,
            subscription__end_date__lte=expiry_threshold
        ).distinct()
        
        members_inactive = base_query.filter(
            subscription__end_date__gte=today
        ).exclude(
            subscription__attendance_attendances__attendance_date__gt=inactive_threshold
        ).distinct()

        serializer_without = MemberSerializer(members_without_subscriptions, many=True)
        serializer_expired = MemberSerializer(members_with_expired_subscriptions, many=True)
        serializer_near_expiry = MemberSerializer(members_with_near_expiry, many=True)
        serializer_inactive = MemberSerializer(members_inactive, many=True)

        response_data = {
            'without_subscriptions': {
                'count': members_without_subscriptions.count(),
                'results': serializer_without.data,
            },
            'expired_subscriptions': {
                'count': members_with_expired_subscriptions.count(),
                'results': serializer_expired.data,
            },
            'near_expiry_subscriptions': {
                'count': members_with_near_expiry.count(),
                'results': serializer_near_expiry.data,
            },
            'inactive_members': {
                'count': members_inactive.count(),
                'results': serializer_inactive.data,
            },
            'days': expiry_days,
            'inactive_days': inactive_days,
        }

        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in export_subscription_report_api: {str(e)}")
        return Response({'error': f'خطأ داخلي: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)