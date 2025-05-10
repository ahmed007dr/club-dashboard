import logging
from django.conf import settings
from django.http import HttpResponseForbidden
from django.utils.deprecation import MiddlewareMixin
from django.utils.timezone import now

from .models import AllowedDevice, AllowedIP
from .utils import generate_device_id, update_last_seen

logger = logging.getLogger(__name__)


class DeviceAccessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            device_id = generate_device_id(request)
            device_qs = AllowedDevice.objects.filter(
                user=request.user,
                device_id=device_id,
                is_active=True
            )

            if not device_qs.exists():
                logger.warning(
                    f"[DEVICE BLOCKED] user={request.user.username}, device_id={device_id}"
                )
                return HttpResponseForbidden(
                    "This device is not authorized. Please register it via the admin dashboard or contact support."
                )

            device = device_qs.first()
            session_token = request.session.get('device_token')
            if session_token != str(device.device_token):
                logger.warning(
                    f"[TOKEN MISMATCH] user={request.user.username}, device_id={device_id}"
                )
                return HttpResponseForbidden("Invalid device token. Please re-authenticate.")

            update_last_seen(device)

        return self.get_response(request)


class RestrictAdminByIPMiddleware(MiddlewareMixin):
    def process_request(self, request):
        add_initial_ip_if_needed(request) 

        if request.path.startswith('/long-life-egypt2030/'):
            ip = self.get_client_ip(request)

            db_ips = list(AllowedIP.objects.values_list('ip_address', flat=True))
            default_ips = getattr(settings, 'DEFAULT_ALLOWED_IPS', [])
            allowed_ips = list(set(db_ips + default_ips))

            if ip not in allowed_ips:
                logger.warning(f"[ADMIN BLOCKED] IP={ip} حاول الدخول لمسار الإدارة.")
                return HttpResponseForbidden("403 Forbidden: Access denied.")

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR')


def add_initial_ip_if_needed(request):
    if AllowedIP.objects.count() == 0:
        ip = get_client_ip(request)
        AllowedIP.objects.create(ip_address=ip, description="Auto-added on first request")
