from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Club
from .forms import ClubForm
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.shortcuts import redirect, render

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


def custom_login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        if user:
            login(request, user)
            if user.role == "owner":
                return redirect("owner_dashboard")
            elif user.role == "admin":
                return redirect("admin_dashboard")
            elif user.role == "reception":
                return redirect("reception_dashboard")
            # وهكذا
        else:
            messages.error(request, "اسم المستخدم أو كلمة المرور غير صحيحة.")
    return render(request, "login.html")


def handler404(request, exception):
    return render(request, '404.html', status=404)

def handler500(request):
    return render(request, '500.html', status=500)
