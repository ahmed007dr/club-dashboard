# accounts/views.py

from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages

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
            elif user.role == "accountant":
                return redirect("accountant_dashboard")
            elif user.role == "coach":
                return redirect("coach_dashboard")
            else:
                messages.warning(request, "لم يتم تحديد صلاحية هذا المستخدم.")
                return redirect("login")
        else:
            messages.error(request, "اسم المستخدم أو كلمة المرور غير صحيحة.")
    
    return render(request, "accounts/login.html")
