from django.http import HttpResponseForbidden
from django.utils.timezone import now
from .models import AllowedDevice
from .utils import generate_device_id, update_last_seen
import logging

logger = logging.getLogger(__name__)

class DeviceAccessMiddleware:
    """
    Middleware to restrict access to authenticated users from authorized devices only.
    Updates device last_seen timestamp and logs unauthorized access attempts.
    """
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
                    f"Unauthorized device access attempt: user={request.user.username}, device_id={device_id}"
                )
                return HttpResponseForbidden(
                    "This device is not authorized. Please register it via the admin dashboard or contact support."
                )

            device = device_qs.first()
            # Verify device token (additional security layer)
            device_token = request.session.get('device_token')
            if device_token != str(device.device_token):
                logger.warning(
                    f"Invalid device token: user={request.user.username}, device_id={device_id}"
                )
                return HttpResponseForbidden("Invalid device token. Please re-authenticate.")

            update_last_seen(device)  # Update last_seen with caching

        return self.get_response(request)