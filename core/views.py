from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Club
from .forms import ClubForm

# عرض بيانات النادي
@login_required
def club_profile(request):
    club = get_object_or_404(Club, id=request.user.club_id)
    return render(request, 'core/club_profile.html', {'club': club})

# تعديل بيانات النادي
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
