from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from django.utils.timezone import now
from django.http import HttpResponseForbidden
from .models import AllowedDevice, ExtendedUserVisit, DeviceSettings ,UserVisit
from .utils import generate_device_id, update_last_seen
import logging

logger = logging.getLogger(__name__)

@receiver(user_logged_in)
def handle_login(sender, request, user, **kwargs):
    """
    Handles user login by registering or updating the device.
    Enforces maximum device limit and sets device token in session.
    """
    device_id = generate_device_id(request)
    device_type = getattr(request.user_agent.device, 'family', 'Unknown')
    device_qs = AllowedDevice.objects.filter(user=user, device_id=device_id)

    if not device_qs.exists():
        # Get max_allowed_devices from DeviceSettings
        device_settings = DeviceSettings.objects.first()
        max_devices = device_settings.max_allowed_devices if device_settings else 50 # Fallback to 6
        
        if AllowedDevice.objects.filter(user=user, is_active=True).count() >= max_devices:
            logger.warning(
                f"Max device limit exceeded: user={user.username}, device_id={device_id}"
            )
            return HttpResponseForbidden(
                f"You have reached the maximum limit of {max_devices} devices. "
                "Please deactivate an existing device via the admin dashboard."
            )

        device = AllowedDevice.objects.create(
            user=user,
            device_id=device_id,
            device_type=device_type,
            device_name=device_type,
            is_active=True,
            last_seen=now()
        )
        logger.info(f"New device registered: user={user.username}, device_id={device_id}")
    else:
        device = device_qs.first()
        device.is_active = True
        update_last_seen(device)

    # Store device token in session for verification
    request.session['device_token'] = str(device.device_token)

@receiver(user_logged_out)
def handle_logout(sender, request, user, **kwargs):
    """
    Handles user logout by deactivating the device and updating session duration.
    """
    device_id = generate_device_id(request)
    device = AllowedDevice.objects.filter(user=user, device_id=device_id).first()
    if device:
        device.is_active = False
        update_last_seen(device)
        logger.info(f"Device deactivated on logout: user={user.username}, device_id={device_id}")

    # Update session duration
    user_visit = UserVisit.objects.filter(
        user=user,
        session_key=request.session.session_key
    ).first()
    if user_visit:
        extended_visit, created = ExtendedUserVisit.objects.get_or_create(user_visit=user_visit)
        if not extended_visit.session_duration:
            extended_visit.session_duration = now() - user_visit.timestamp
            extended_visit.save()
            logger.info(
                f"Session duration updated: user={user.username}, duration={extended_visit.session_duration}"
            )