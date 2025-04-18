from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Club, User
from .serializers import ClubSerializer, UserProfileSerializer
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

@api_view(['GET'])
@login_required
def api_user_profile(request):
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)

@login_required
def club_profile(request):
    club = get_object_or_404(Club, id=request.user.club_id)
    return render(request, 'core/club_profile.html', {'club': club})

@login_required
def edit_club(request):
    club = get_object_or_404(Club, id=request.user.club_id)
    if request.method == 'POST':
        form = ClubForm(request.POST, request.FILES, instance=club)
        if form.is_valid():
            form.save()
            return JsonResponse({'status': 'success'})
    else:
        form = ClubForm(instance=club)
    return render(request, 'core/edit_club.html', {'form': form})