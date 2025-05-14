from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Club
from .serializers import ClubSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_club_profile(request):
    club = get_object_or_404(Club, id=request.user.club_id)
    serializer = ClubSerializer(club)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_edit_club(request):
    club = get_object_or_404(Club, id=request.user.club_id)
    serializer = ClubSerializer(club, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return JsonResponse({
            'status': 'success',
            'data': serializer.data
        })
    return JsonResponse({
        'status': 'error',
        'errors': serializer.errors
    }, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_switch_club(request):
    user = request.user

    if user.role != 'owner':
        return Response({'error': 'Only owners can switch clubs.'}, status=403)

    club_id = request.data.get('club_id')
    if not club_id:
        return Response({'error': 'club_id is required.'}, status=400)

    try:
        club = Club.objects.get(id=club_id)
    except Club.DoesNotExist:
        return Response({'error': 'Club not found.'}, status=404)
    user.club = club
    user.save(update_fields=['club'])

    return Response({
        'message': f'Switched to club: {club.name}',
        'club': {
            'id': club.id,
            'name': club.name,
            'location': club.location
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_list_clubs(request):
    if request.user.role != 'owner':
        return Response({'error': 'Only owners can view all clubs.'}, status=403)

    from .serializers import ClubSerializer
    clubs = Club.objects.all()
    serializer = ClubSerializer(clubs, many=True)
    return Response(serializer.data)
