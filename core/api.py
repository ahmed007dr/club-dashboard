from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Club
from .serializers import ClubSerializer
import logging

logger = logging.getLogger(__name__)

FULL_ACCESS_ROLES = ['owner', 'admin']

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_club_profile(request):
    """Retrieve the profile of the user's associated club without permission checks."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    club = get_object_or_404(Club, id=request.user.club_id)
    serializer = ClubSerializer(club)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_edit_club(request):
    """Update the user's associated club (Owner/Admin only)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.user.role not in FULL_ACCESS_ROLES:
        logger.warning(f"Edit permission denied for clubs: {request.user.username}")
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
    """Switch the user's associated club (Owner/Admin only)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.user.role not in FULL_ACCESS_ROLES:
        logger.warning(f"Edit permission denied for club switching: {request.user.username}")
        return Response({'error': 'غير مسموح بتبديل الأندية. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    
    user = request.user
    club_id = request.data.get('club_id')
    if not club_id:
        logger.error(f"Club ID not provided for user: {request.user.username}")
        return Response({'error': 'معرف النادي مطلوب.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        club = Club.objects.get(id=club_id)
    except Club.DoesNotExist:
        logger.error(f"Club {club_id} not found for user: {request.user.username}")
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
    """List all clubs without permission checks."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    clubs = Club.objects.all()
    serializer = ClubSerializer(clubs, many=True)
    return Response(serializer.data)
