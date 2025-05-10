import hashlib
from django.utils.timezone import now
import logging

logger = logging.getLogger(__name__)

def generate_device_id(request):
    """
    Generates a unique device fingerprint based on user agent, IP, and additional metadata.
    """
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    ip_address = request.META.get('REMOTE_ADDR', '')
    extra_data = request.META.get('HTTP_ACCEPT_LANGUAGE', '')
    
    raw_data = f"{user_agent}-{ip_address}-{extra_data}"
    device_id = hashlib.sha256(raw_data.encode()).hexdigest()
    
    return device_id

def update_last_seen(device):
    """
    Updates the device's last_seen timestamp directly in the database.
    """
    device.last_seen = now()
    device.save(update_fields=['last_seen'])
    logger.info(f"Updated last_seen for device {device.device_id}")

#### with redis

# import hashlib
# from django.conf import settings
# from django.core.cache import cache
# from django.utils.timezone import now
# import logging

# logger = logging.getLogger(__name__)

# def generate_device_id(request):
#     """
#     Generates a unique device fingerprint based on user agent, IP, and additional metadata.
#     """
#     user_agent = request.META.get('HTTP_USER_AGENT', '')
#     ip_address = request.META.get('REMOTE_ADDR', '')
#     # Additional metadata (e.g., screen resolution could be sent via AJAX)
#     extra_data = request.META.get('HTTP_ACCEPT_LANGUAGE', '')
    
#     raw_data = f"{user_agent}-{ip_address}-{extra_data}"
#     device_id = hashlib.sha256(raw_data.encode()).hexdigest()
    
#     return device_id

# def update_last_seen(device):
#     """
#     Updates the device's last_seen timestamp with caching to reduce DB writes.
#     Cache is used to ensure updates occur only every 5 minutes.
#     """
#     cache_key = f"device_last_seen_{device.device_id}"
#     last_updated = cache.get(cache_key)
    
#     if not last_updated:
#         device.last_seen = now()
#         device.save(update_fields=['last_seen'])
#         cache.set(cache_key, now(), timeout=5 * 60)  # Cache for 5 minutes
#         logger.info(f"Updated last_seen for device {device.device_id}")


