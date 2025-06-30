from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Club
from .serializers import ClubSerializer
from permissions.permissions import IsOwnerOrRelatedToClub
from permissions.models import GroupPermission
from staff.models import StaffAttendance
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_club_profile(request):
    """Retrieve the profile of the user's associated club without permission checks."""
    club = get_object_or_404(Club, id=request.user.club_id)
    serializer = ClubSerializer(club)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def api_edit_club(request):
    """Update the user's associated club."""
    perm = GroupPermission.objects.filter(group__in=request.user.groups.all(), resource='clubs').first()
    
    if not perm or not perm.can_edit:
        logger.warning(f"Edit permission denied for clubs: {request.user.username}")
        return Response({'error': 'غير مسموح بالتعديل.'}, status=status.HTTP_403_FORBIDDEN)
    
    if perm and perm.shift_restricted and request.user.role not in ['owner', 'admin']:
        attendance = StaffAttendance.objects.filter(
            staff=request.user, club=request.user.club, check_out__isnull=True
        ).order_by('-check_in').first()
        if not attendance:
            logger.warning(f"No active shift for user: {request.user.username}")
            return Response({'error': 'لا يمكن تعديل النادي إلا خلال وردية نشطة.'}, status=status.HTTP_403_FORBIDDEN)
    
    club = get_object_or_404(Club, id=request.user.club_id)
    serializer = ClubSerializer(club, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({'status': 'success', 'data': serializer.data})
    return Response({'status': 'error', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_switch_club(request):
    """Switch the user's associated club."""
    perm = GroupPermission.objects.filter(group__in=request.user.groups.all(), resource='clubs').first()
    
    if not perm or not perm.can_edit:
        logger.warning(f"Edit permission denied for club switching: {request.user.username}")
        return Response({'error': 'غير مسموح بتبديل الأندية.'}, status=status.HTTP_403_FORBIDDEN)
    
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
    clubs = Club.objects.all()
    serializer = ClubSerializer(clubs, many=True)
    return Response(serializer.data)

# @api_view(['GET'])
# @permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
# def api_list_clubs(request):
#     """List all clubs for Owner, or the user's club for other roles."""
#     perm = GroupPermission.objects.filter(group__in=request.user.groups.all(), resource='clubs').first()
    
#     if not perm or not perm.can_view:
#         logger.warning(f"View permission denied for clubs: {request.user.username}")
#         return Response({'error': 'غير مسموح بالعرض.'}, status=status.HTTP_403_FORBIDDEN)
    
#     if request.user.role == 'owner':
#         clubs = Club.objects.all()
#     else:
#         if perm and perm.shift_restricted and request.user.role not in ['owner', 'admin']:
#             attendance = StaffAttendance.objects.filter(
#                 staff=request.user, club=request.user.club, check_out__isnull=True
#             ).order_by('-check_in').first()
#             if not attendance:
#                 logger.warning(f"No active shift for user: {request.user.username}")
#                 return Response({'error': 'لا توجد وردية مفتوحة. يرجى تسجيل الدخول أولاً.'}, status=status.HTTP_404_NOT_FOUND)
#         clubs = Club.objects.filter(id=request.user.club_id)
    
#     serializer = ClubSerializer(clubs, many=True)
#     return Response(serializer.data)