from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import FreeInvite
from .serializers import FreeInviteSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub
from rest_framework.pagination import PageNumberPagination
from django.db import transaction

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def free_invite_list_api(request):
    """List free invites with optional filters."""
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
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
@transaction.atomic
def add_free_invite_api(request):
    """Create a new free invite."""
    data = request.data.copy()
    data['created_by'] = request.user.id
    data['club'] = request.user.club.id
    serializer = FreeInviteSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def free_invite_detail_api(request, invite_id):
    """Retrieve details of a specific free invite."""
    invite = get_object_or_404(FreeInvite, id=invite_id, club=request.user.club)
    serializer = FreeInviteSerializer(invite)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def edit_free_invite_api(request, invite_id):
    """Update a free invite (Owner or Admin only)."""
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'غير مسموح بالتعديل. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    invite = get_object_or_404(FreeInvite, id=invite_id, club=request.user.club)
    serializer = FreeInviteSerializer(invite, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_free_invite_api(request, invite_id):
    """Delete a free invite (Owner or Admin only)."""
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'غير مسموح بالحذف. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    invite = get_object_or_404(FreeInvite, id=invite_id, club=request.user.club)
    invite.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def mark_invite_used_api(request, invite_id):
    """Mark a free invite as used (Owner or Admin only)."""
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'غير مسموح بتغيير حالة الدعوة. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    invite = get_object_or_404(FreeInvite, id=invite_id, club=request.user.club)
    invite.status = 'used'
    invite.save()
    serializer = FreeInviteSerializer(invite)
    return Response(serializer.data)