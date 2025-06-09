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
from staff.models import StaffAttendance
from utils.generate_membership_number import generate_membership_number
from utils.permissions import IsOwnerOrRelatedToClub

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def member_list_api(request):
    search_term = request.GET.get('q', '')
    is_search_mode = bool(search_term)  # Consider it a search if q is provided

    if request.user.role in ['owner', 'admin']:
        members = Member.objects.filter(club=request.user.club).order_by('-id')
    else:
        if is_search_mode:
            # Allow access to all members for search queries
            members = Member.objects.filter(club=request.user.club).order_by('-id')
        else:
            # Restrict to members with attendance in current shift
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True  # Current open shift
            ).order_by('-check_in').first()

            if not attendance:
                return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

            member_ids = Attendance.objects.filter(
                subscription__club=request.user.club,
                attendance_date__gte=attendance.check_in,
                attendance_date__lte=timezone.now()
            ).values_list('subscription__member_id', flat=True).distinct()

            members = Member.objects.filter(
                id__in=member_ids,
                club=request.user.club
            ).order_by('-id')

    if search_term:
        members = members.filter(
            Q(name__icontains=search_term) |
            Q(phone__icontains=search_term) |
            Q(rfid_code__icontains=search_term)
        )

    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(members, request)
    serializer = MemberSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def member_detail_api(request, member_id):
    member = get_object_or_404(Member, id=member_id)
    search_term = request.GET.get('q', '')
    is_search_mode = bool(search_term)  # Consider it a search if q is provided

    if request.user.role not in ['owner', 'admin'] and not is_search_mode:
        # Restrict to members with attendance in current shift
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

        has_interaction = Attendance.objects.filter(
            subscription__club=request.user.club,
            subscription__member_id=member_id,
            attendance_date__gte=attendance.check_in,
            attendance_date__lte=timezone.now()
        ).exists()

        if not has_interaction:
            return Response({'error': 'This member is not associated with your current shift.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = MemberSerializer(member)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def member_search_api(request):
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
    ).order_by('-id')

    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(members, request)
    serializer = MemberSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user_profile(request):
    user = request.user
    profile_data = {
        'username': user.username,
        'email': user.email,
    }
    return Response(profile_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def create_member_api(request):
    if request.user.role not in ['owner', 'admin']:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'You can only create members during an active shift.'}, status=status.HTTP_403_FORBIDDEN)

    membership_number = generate_membership_number()
    data = request.data.copy()
    data['membership_number'] = membership_number

    serializer = MemberSerializer(data=data, context={'request': request})

    if serializer.is_valid():
        try:
            member = serializer.save()
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, member):
                member.delete()
                return Response({'error': 'You do not have permission to create a member for this club'}, status=status.HTTP_403_FORBIDDEN)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response({'error': 'Membership number or RFID code already exists'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Error uploading file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def update_member_api(request, member_id):
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'Only owners or admins can update members.'}, status=status.HTTP_403_FORBIDDEN)

    member = get_object_or_404(Member, id=member_id)
    serializer = MemberSerializer(member, data=request.data)
    if serializer.is_valid():
        updated_member = serializer.save()
        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, updated_member):
            return Response({'error': 'You do not have permission to update this member to this club'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_member_api(request, member_id):
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'Only owners or admins can delete members.'}, status=status.HTTP_403_FORBIDDEN)

    member = get_object_or_404(Member, id=member_id)
    member.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def member_subscription_report_api(request):
    try:
        club_id = request.user.club.id if hasattr(request.user, 'club') else None
        if not club_id:
            return Response({'error': 'لا يوجد نادي مرتبط بالمستخدم'}, status=status.HTTP_403_FORBIDDEN)

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
        print(f"Error in member_subscription_report_api: {str(e)}")
        return Response({'error': f'خطأ داخلي: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def export_subscription_report_api(request):
    try:
        club_id = request.user.club.id if hasattr(request.user, 'club') else None
        if not club_id:
            return Response({'error': 'لا يوجد نادي مرتبط بالمستخدم'}, status=status.HTTP_403_FORBIDDEN)

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
        print(f"Error in export_subscription_report_api: {str(e)}")
        return Response({'error': f'خطأ داخلي: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)