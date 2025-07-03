from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
import logging
from .models import GroupPermission
from staff.models import StaffAttendance

logger = logging.getLogger(__name__)

# متغير للتحكم في تعليق الصلاحيات (يمكن استبداله بمنطق أكثر تعقيدًا مثل قاعدة بيانات)
RESTRICTIONS_SUSPENDED = True  # تعليق الصلاحيات مؤقتًا إذا كان True

def check_permission(user, resource, method, club_required=True):
    """
    Check if the user has permission for the given resource and HTTP method.
    Returns: (bool, Response) - (is_allowed, error_response if not allowed)
    """
    if not user.is_authenticated:
        logger.error(f"User not authenticated for {resource}")
        return False, Response({'error': 'غير مسموح: يجب تسجيل الدخول.'}, status=status.HTTP_401_UNAUTHORIZED)

    if club_required and not user.club:
        logger.error(f"User {user.username} has no associated club")
        return False, Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)

    # Check if user has full access (owner/admin)
    FULL_ACCESS_ROLES = ['owner', 'admin']
    if user.role in FULL_ACCESS_ROLES:
        return True, None

    # عند تعليق الصلاحيات
    if RESTRICTIONS_SUSPENDED:
        # السماح بـ PUT/DELETE فقط للأدمن والمالك، وتجاهل بقية القيود
        if method in ['PUT', 'PATCH', 'DELETE']:
            logger.warning(f"{method} permission denied for {resource} for user: {user.username}")
            return False, Response({'error': f'غير مسموح بـ {method.lower()}.'}, status=status.HTTP_403_FORBIDDEN)
        # السماح بـ GET/POST بدون قيود (مثل can_view, can_create, أو الوردية)
        logger.debug(f"Restrictions suspended, allowing {method} for {resource} for user: {user.username}")
        return True, None

    # المنطق الطبيعي (بدون تعليق الصلاحيات)
    # Get permission for the resource
    perm = GroupPermission.objects.filter(group__in=user.groups.all(), resource=resource).first()
    if not perm:
        logger.warning(f"No permissions for {resource} for user: {user.username}")
        return False, Response({'error': 'غير مسموح: لا توجد صلاحيات لهذا المورد.'}, status=status.HTTP_403_FORBIDDEN)

    # Check specific permissions based on method
    if method in ['GET', 'HEAD', 'OPTIONS']:  # SAFE methods
        if not perm.can_view:
            logger.warning(f"View permission denied for {resource} for user: {user.username}")
            return False, Response({'error': 'غير مسموح بالعرض.'}, status=status.HTTP_403_FORBIDDEN)
    elif method == 'POST':
        if not perm.can_create:
            logger.warning(f"Create permission denied for {resource} for user: {user.username}")
            return False, Response({'error': 'غير مسموح بالإنشاء.'}, status=status.HTTP_403_FORBIDDEN)
    elif method in ['PUT', 'PATCH']:
        if not perm.can_edit:
            logger.warning(f"Edit permission denied for {resource} for user: {user.username}")
            return False, Response({'error': 'غير مسموح بالتعديل.'}, status=status.HTTP_403_FORBIDDEN)
    elif method == 'DELETE':
        if not perm.can_delete:
            logger.warning(f"Delete permission denied for {resource} for user: {user.username}")
            return False, Response({'error': 'غير مسموح بالحذف.'}, status=status.HTTP_403_FORBIDDEN)

    # Check shift restriction for non-safe methods
    if perm.shift_restricted and method not in ['GET', 'HEAD', 'OPTIONS'] and user.role not in FULL_ACCESS_ROLES:
        attendance = StaffAttendance.objects.filter(
            staff=user, club=user.club, check_out__isnull=True
        ).order_by('-check_in').first()
        if not attendance:
            logger.warning(f"No active shift for user: {user.username} for {resource}")
            return False, Response({'error': 'لا يمكن تنفيذ العملية إلا خلال وردية نشطة.'}, status=status.HTTP_403_FORBIDDEN)

    return True, None