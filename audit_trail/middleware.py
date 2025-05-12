from django.utils.deprecation import MiddlewareMixin
from audit_trail.models import AuditLog, UserVisitLog
from threading import local
from django.utils import timezone

_user = local()

def get_current_user():
    """Get the current user from thread-local storage."""
    return getattr(_user, 'value', None)

class CurrentUserMiddleware(MiddlewareMixin):
    def process_request(self, request):
        _user.value = request.user if request.user.is_authenticated else None

class AuditLogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._audit_log_action = request.method
        if request.user.is_authenticated and request.method == 'POST' and request.path.endswith('/api/login/'):
            UserVisitLog.objects.create(
                user=request.user,
                ip_address=request.META.get('REMOTE_ADDR'),
                device_info=request.META.get('HTTP_USER_AGENT', '')[:255],
                session_key=request.session.session_key
            )

    def process_response(self, request, response):
        if hasattr(request, 'user') and request.user.is_authenticated:
            action = 'request'
            description = f"{request.method} {request.path}"

            if request.path.endswith('/api/login/') and request.method == 'POST':
                action = 'login'
                description = 'User logged in'
            elif request.path.endswith('/api/logout/') and request.method == 'POST':
                action = 'logout'
                description = 'User logged out'
                # Update the latest UserVisitLog for this user
                UserVisitLog.objects.filter(
                    user=request.user,
                    logout_time__isnull=True,
                    session_key=request.session.session_key
                ).update(logout_time=timezone.now())
            elif response.status_code >= 400:
                action = 'error'
                description = f"Error {response.status_code} on {request.method} {request.path}"

            AuditLog.objects.create(
                action=action,
                app_name=request.resolver_match.app_name if hasattr(request.resolver_match, 'app_name') else '',
                model_name='',
                object_id='',
                description=description,
                user=request.user,
            )
        return response