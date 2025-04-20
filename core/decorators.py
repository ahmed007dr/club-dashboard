from django.http import HttpResponseForbidden
from functools import wraps

def role_required(allowed_roles=[]):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user = request.user
            if user.is_authenticated and user.role in allowed_roles:
                return view_func(request, *args, **kwargs)
            return HttpResponseForbidden("ليس لديك صلاحية للوصول إلى هذه الصفحة.")
        return wrapper
    return decorator





def deny_roles(denied_roles=[]):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user = request.user
            if user.is_authenticated and user.role in denied_roles:
                return HttpResponseForbidden("ليس لديك صلاحية للوصول إلى هذه الصفحة.")
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

# from core.decorators import role_required  # لو ملفك اسمه decorators.py جوه app اسمه core


# @role_required(['owner', 'admin'])
# def manage_clubs(request):
#     clubs = Club.objects.all()
#     return render(request, 'clubs/manage.html', {'clubs': clubs})


# @deny_roles(['reception', 'coach'])
# def sensitive_page(request):
#     # الصفحة دي متاحة لأي حد ما عدا الـ reception والـ coach
#     return render(request, 'core/sensitive.html')
