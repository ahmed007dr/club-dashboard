from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import AllowedDevice
import logging

logger = logging.getLogger(__name__)

@login_required
def device_list(request):
    """
    Displays a list of user's authorized devices and allows deactivation.
    """
    devices = AllowedDevice.objects.filter(user=request.user).order_by('-last_seen')
    
    if request.method == 'POST':
        device_id = request.POST.get('device_id')
        device = AllowedDevice.objects.filter(user=request.user, device_id=device_id).first()
        if device:
            device.is_active = False
            device.save()
            messages.success(request, f"Device '{device.device_name or device.device_type}' deactivated.")
            logger.info(f"Device deactivated by user: user={request.user.username}, device_id={device_id}")
        else:
            messages.error(request, "Invalid device.")
            logger.warning(
                f"Invalid device deactivation attempt: user={request.user.username}, device_id={device_id}"
            )
        return redirect('devices:device_list')

    return render(request, 'devices/device_list.html', {'devices': devices})

@login_required
def device_not_authorized(request):
    """
    Displays a page when a user attempts to access from an unauthorized device.
    """
    return render(request, 'devices/device_not_authorized.html')