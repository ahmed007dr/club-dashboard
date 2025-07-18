from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import FreeInvite
from .serializers import FreeInviteSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db import transaction
import logging
from subscriptions.models import Subscription
from members.models import Member
from django.utils import timezone


logger = logging.getLogger(__name__)

FULL_ACCESS_ROLES = ['owner', 'admin']

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def free_invite_list_api(request):
    """List free invites with optional filters."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    invites = FreeInvite.objects.select_related('club').filter(club=request.user.club).order_by('-created_at')
    if request.query_params.get('guest_name'):
        invites = invites.filter(guest_name__icontains=request.query_params.get('guest_name'))
    if request.query_params.get('status'):
        invites = invites.filter(status=request.query_params.get('status').lower())
    if request.query_params.get('date'):
        invites = invites.filter(date=request.query_params.get('date'))
    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(invites, request)
    serializer = FreeInviteSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def add_free_invite_api(request):
    """Create a new free invite."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    data = request.data.copy()
    data['created_by'] = request.user.id
    data['club'] = request.user.club.id

    serializer = FreeInviteSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def free_invite_detail_api(request, invite_id):
    """Retrieve details of a specific free invite."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    invite = get_object_or_404(FreeInvite, id=invite_id, club=request.user.club)
    serializer = FreeInviteSerializer(invite)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_free_invite_api(request, invite_id):
    """Update a free invite (Owner or Admin only)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.user.role not in FULL_ACCESS_ROLES:
        return Response({'error': 'غير مسموح بالتعديل. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    
    invite = get_object_or_404(FreeInvite, id=invite_id, club=request.user.club)
    serializer = FreeInviteSerializer(invite, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_free_invite_api(request, invite_id):
    """Delete a free invite (Owner or Admin only)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.user.role not in FULL_ACCESS_ROLES:
        return Response({'error': 'غير مسموح بالحذف. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    
    invite = get_object_or_404(FreeInvite, id=invite_id, club=request.user.club)
    invite.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_invite_used_api(request, invite_id):
    """Mark a free invite as used (Owner or Admin only)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.user.role not in FULL_ACCESS_ROLES:
        return Response({'error': 'غير مسموح بتغيير حالة الدعوة. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    
    invite = get_object_or_404(FreeInvite, id=invite_id, club=request.user.club)
    invite.status = 'used'
    invite.save()
    serializer = FreeInviteSerializer(invite)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_by_rfid_api(request):
    rfid_code = request.query_params.get('rfid_code')
    if not rfid_code:
        return Response({'error': 'RFID Code مطلوب'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        member = Member.objects.get(rfid_code=rfid_code, club=request.user.club)
    except Member.DoesNotExist:
        return Response({'error': 'لم يتم العثور على عضو بهذا الـ RFID'}, status=status.HTTP_404_NOT_FOUND)

    today = timezone.now().date()
    subscriptions = Subscription.objects.filter(
        member=member,
        club=request.user.club,
        start_date__lte=today,
        end_date__gte=today,
        is_cancelled=False
    )

    remaining_invites = []
    for subscription in subscriptions:
        used_invites = FreeInvite.objects.filter(
            subscription=subscription,
            status__in=['pending', 'used']
        ).count()
        remaining = max(0, subscription.type.free_invites_allowed - used_invites)
        remaining_invites.append({
            'subscription_id': subscription.id,
            'subscription_type': subscription.type.name,
            'total_allowed': subscription.type.free_invites_allowed,
            'used': used_invites,
            'remaining': remaining
        })

    return Response({
        'member_id': member.id,
        'member_name': member.name,
        'membership_number': member.membership_number,
        'club': member.club.id,
        'subscriptions': remaining_invites
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_remaining_invites_api(request, member_id):
    """Get remaining free invites for a member."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    member = get_object_or_404(Member, id=member_id, club=request.user.club)
    today = timezone.now().date()
    
    subscriptions = Subscription.objects.filter(
        member=member,
        club=request.user.club,
        start_date__lte=today,
        end_date__gte=today,
        is_cancelled=False
    )
    
    remaining_invites = []
    for subscription in subscriptions:
        used_invites = FreeInvite.objects.filter(
            subscription=subscription,
            status__in=['pending', 'used']
        ).count()
        remaining = max(0, subscription.type.free_invites_allowed - used_invites)
        remaining_invites.append({
            'subscription_id': subscription.id,
            'subscription_type': subscription.type.name,
            'total_allowed': subscription.type.free_invites_allowed,
            'used': used_invites,
            'remaining': remaining
        })
    
    return Response({
        'member_id': member.id,
        'member_name': member.name,
        'remaining_invites': remaining_invites
    })