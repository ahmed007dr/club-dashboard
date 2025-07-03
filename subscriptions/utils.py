from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)

RESTRICTIONS_SUSPENDED = True  # تعليق الصلاحيات مؤقتًا إذا كان True

def restrict_access(user, method, resource):
    """
    Check access restrictions for a user on a specific resource.
    - All users must be authenticated and associated with a club.
    - PUT/DELETE restricted to owner/admin.
    - GET restricted to last 24 hours for non-owner/admin (unless restrictions are suspended).
    Returns: (is_allowed, error_response, time_filter)
    """
    if not user.is_authenticated:
        logger.error(f"User not authenticated for {resource}")
        return False, Response({'error': 'غير مسموح: يجب تسجيل الدخول.'}, status=status.HTTP_401_UNAUTHORIZED), None

    if not user.club:
        logger.error(f"User {user.username} has no associated club")
        return False, Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN), None


    FULL_ACCESS_ROLES = ['owner', 'admin']
    if RESTRICTIONS_SUSPENDED:
        if method in ['PUT', 'PATCH', 'DELETE'] and user.role not in FULL_ACCESS_ROLES:
            logger.warning(f"{method} permission denied for {resource} for user: {user.username}")
            return False, Response({'error': f'غير مسموح بـ {method.lower()}.'}, status=status.HTTP_403_FORBIDDEN), None
        logger.debug(f"Restrictions suspended, no time filter for {resource} for user: {user.username}")
        return True, None, None

    if method in ['PUT', 'PATCH', 'DELETE'] and user.role not in FULL_ACCESS_ROLES:
        logger.warning(f"{method} permission denied for {resource} for user: {user.username}")
        return False, Response({'error': f'غير مسموح بـ {method.lower()}.'}, status=status.HTTP_403_FORBIDDEN), None

    time_filter = None
    if method in ['GET', 'HEAD', 'OPTIONS'] and user.role not in FULL_ACCESS_ROLES:
        time_filter = {'created_at__gte': timezone.now() - timedelta(hours=24)}
        logger.debug(f"Applying 24-hour filter for {resource} for user: {user.username}")

    return True, None, time_filter