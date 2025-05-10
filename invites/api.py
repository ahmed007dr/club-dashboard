from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import FreeInvite
from .serializers import FreeInviteSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub 

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def free_invite_list_api(request):
    if request.user.role == 'owner':
        invites = FreeInvite.objects.select_related('club', 'invited_by').all()  
    else:
        invites = FreeInvite.objects.select_related('club', 'invited_by').filter(club=request.user.club)  

    serializer = FreeInviteSerializer(invites, many=True)
    return Response(serializer.data)


from django.db import transaction

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