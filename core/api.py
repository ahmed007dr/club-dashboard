from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Club
from .serializers import ClubSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def api_club_profile(request):
    """Retrieve the profile of the user's associated club."""
    club = get_object_or_404(Club, id=request.user.club_id)
    serializer = ClubSerializer(club)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def api_edit_club(request):
    """Update the user's associated club (Owner or Admin only)."""
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'غير مسموح بالتعديل. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    club = get_object_or_404(Club, id=request.user.club_id)
    serializer = ClubSerializer(club, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({'status': 'success', 'data': serializer.data})
    return Response({'status': 'error', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_switch_club(request):
    """Switch the user's associated club (Owner only)."""
    user = request.user
    if user.role != 'owner':
        return Response({'error': 'فقط Owner يمكنه تبديل الأندية.'}, status=status.HTTP_403_FORBIDDEN)
    club_id = request.data.get('club_id')
    if not club_id:
        return Response({'error': 'معرف النادي مطلوب.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        club = Club.objects.get(id=club_id)
    except Club.DoesNotExist:
        return Response({'error': 'النادي غير موجود.'}, status=status.HTTP_404_NOT_FOUND)
    user.club = club
    user.save(update_fields=['club'])
    return Response({
        'message': f'تم التبديل إلى النادي: {club.name}',
        'club': {'id': club.id, 'name': club.name, 'location': club.location}
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_list_clubs(request):
    """List all clubs for Owner, or the user's club for other roles."""
    if request.user.role == 'owner':
        clubs = Club.objects.all()
    else:
        clubs = Club.objects.filter(id=request.user.club_id)
    serializer = ClubSerializer(clubs, many=True)
    return Response(serializer.data)