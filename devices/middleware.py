import logging
from django.conf import settings
from django.http import HttpResponseForbidden
from django.utils.deprecation import MiddlewareMixin
from django.utils.timezone import now
from django.core.cache import cache

from .models import AllowedDevice, AllowedIP
from .utils import generate_device_id, update_last_seen

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        username = request.user.username if request.user.is_authenticated else "Anonymous"
        ip = request.META.get('REMOTE_ADDR', 'unknown')
        logger.info(f"Request: {request.method} {request.path} by user {username} from IP {ip}")
        response = self.get_response(request)
        logger.info(f"Response: {response.status_code} for {request.method} {request.path}")
        return response

class DeviceAccessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            device_id = generate_device_id(request)
            device = AllowedDevice.objects.filter(
                user=request.user,
                device_id=device_id,
                is_active=True
            ).first()

            if not device:
                logger.warning(f"[DEVICE BLOCKED] user={request.user.username}, device_id={device_id}")
                return HttpResponseForbidden("This device is not authorized. Please register it via the admin dashboard or contact support.")

            session_token = request.session.get('device_token')
            if session_token != str(device.device_token):
                logger.warning(f"[TOKEN MISMATCH] user={request.user.username}, device_id={device_id}")
                return HttpResponseForbidden("Invalid device token. Please re-authenticate.")

            update_last_seen(device)

        return self.get_response(request)

class RestrictAdminByIPMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        add_initial_ip_if_needed(request)

        if request.path.startswith('/long-life-egypt2030/'):
            ip = self.get_client_ip(request)
            if not ip:
                return HttpResponseForbidden("403 Forbidden: Invalid IP address.")

            allowed_ips = self.get_allowed_ips()
            if ip not in allowed_ips:
                logger.warning(f"[ADMIN BLOCKED] IP={ip} حاول الدخول لمسار الإدارة.")
                return HttpResponseForbidden("403 Forbidden: Access denied.")

        return self.get_response(request)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        if not ip or ip == 'unknown':
            logger.warning("Could not determine client IP.")
            return None
        return ip

    def get_allowed_ips(self):
        allowed_ips = cache.get('allowed_ips')
        if allowed_ips is None:
            db_ips = list(AllowedIP.objects.values_list('ip_address', flat=True))
            default_ips = getattr(settings, 'DEFAULT_ALLOWED_IPS', [])
            allowed_ips = list(set(db_ips + default_ips))
            cache.set('allowed_ips', allowed_ips, timeout=3600)  # 1 hour
        return allowed_ips

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')

def add_initial_ip_if_needed(request):
    if not AllowedIP.objects.exists():
        ip = get_client_ip(request)
        if ip and ip != 'unknown':
            AllowedIP.objects.get_or_create(
                ip_address=ip,
                defaults={'description': "Auto-added on first request"}
            )