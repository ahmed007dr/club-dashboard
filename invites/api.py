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
    # Base queryset: Only invites for the user's club
    invites = FreeInvite.objects.select_related('club').filter(club=request.user.club).order_by('-created_at')

    # Apply filters based on query parameters
    guest_name = request.query_params.get('guest_name', None)
    status = request.query_params.get('status', None)
    date = request.query_params.get('date', None)
    
    if guest_name:
        invites = invites.filter(guest_name__icontains=guest_name)
    
    if status:
        invites = invites.filter(status=status.lower())
    
    if date:
        invites = invites.filter(date=date)
    
    # Pagination
    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(invites, request)
    serializer = FreeInviteSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
@transaction.atomic
def add_free_invite_api(request):
    data = request.data.copy()

    serializer = FreeInviteSerializer(data=data)
    if serializer.is_valid():
        invite = serializer.save()
        invite.refresh_from_db()

        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, invite):
            invite.delete()
            return Response({'detail': 'You do not have permission to create a free invite for this club'}, status=status.HTTP_403_FORBIDDEN)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def free_invite_detail_api(request, invite_id):
    invite = get_object_or_404(FreeInvite, id=invite_id)
    serializer = FreeInviteSerializer(invite)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def edit_free_invite_api(request, invite_id):
    invite = get_object_or_404(FreeInvite, id=invite_id)
    serializer = FreeInviteSerializer(invite, data=request.data, partial=True)
    if serializer.is_valid():
        updated_invite = serializer.save()
        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, updated_invite):
            return Response({'error': 'You do not have permission to update this free invite to this club'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_free_invite_api(request, invite_id):
    invite = get_object_or_404(FreeInvite, id=invite_id)
    invite.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def mark_invite_used_api(request, invite_id):
    invite = get_object_or_404(FreeInvite, id=invite_id)
    invite.status = 'used'
    invite.save()
    serializer = FreeInviteSerializer(invite)
    return Response(serializer.data)