from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Club
from .serializers import ClubSerializer
from .forms import ClubForm


@api_view(['GET'])
@login_required
def api_club_profile(request):
    club = get_object_or_404(Club, id=request.user.club_id)
    serializer = ClubSerializer(club)
    return Response(serializer.data)


@api_view(['POST'])
@login_required
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
