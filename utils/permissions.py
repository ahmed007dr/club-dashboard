from rest_framework import permissions
from staff.models import StaffAttendance
from django.utils import timezone
from utils.finance_permissions import apply_finance_permissions, FINANCE_PERMISSION_RULES
import logging
logger = logging.getLogger(__name__)


class IsOwnerOrRelatedToClub(permissions.BasePermission):
    FULL_ACCESS_ROLES = ['owner', 'admin']
    LIMITED_ACCESS_ROLES = ['reception', 'accounting', 'coach']

    def _get_club(self, obj):
        club = getattr(obj, 'club', None)
        if not club and hasattr(obj, 'subscription') and obj.subscription:
            club = getattr(obj.subscription, 'club', None)
        return club

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            logger.error("User not authenticated")
            return False

        view_name = getattr(view, '__name__', getattr(view.__class__, '__name__', ''))
        if view_name in ['staff_check_in_by_code_api', 'staff_check_out_by_code_api', 'api_user_list']:
            logger.debug(f"Allowing access to {view_name} for user: {request.user.username}")
            return True

        # Finance-specific permissions
        if view and getattr(view, '__module__', '').startswith('finance.views'):
            finance_perm = apply_finance_permissions(view, request)
            if finance_perm and isinstance(finance_perm, dict):
                request.finance_shift_info = finance_perm
                return True
            elif finance_perm is None:
                return True
            logger.warning(f"Finance permission denied for user: {request.user.username}")
            return False

        if not request.user.club:
            logger.error(f"User {request.user.username} has no associated club")
            return False

        if request.method in permissions.SAFE_METHODS and request.user.role in self.LIMITED_ACCESS_ROLES:
            if view_name in ['api_list_clubs', 'api_club_profile']:
                return True
            attendance = StaffAttendance.objects.filter(
                staff=request.user, club=request.user.club, check_out__isnull=True
            ).order_by('-check_in').first()
            if not attendance:
                logger.warning(f"No active shift for user: {request.user.username}")
                return False
            return True
        return True



    def has_object_permission(self, request, view, obj):
        club = self._get_club(obj)
        if not club or not request.user.club or club != request.user.club:
            logger.error(f"Club mismatch: Object club={club}, User club={request.user.club}")
            return False

        # Finance-specific handling
        if view and getattr(view, '__module__', '').startswith('finance.views'):
            view_name = getattr(view, '__name__', getattr(view.__class__, '__name__', ''))
            if view_name in FINANCE_PERMISSION_RULES['exempt_views']:
                return club == request.user.club
            if request.user.role in self.FULL_ACCESS_ROLES:
                return club == request.user.club
            if request.user.role not in self.LIMITED_ACCESS_ROLES:
                logger.warning(f"User role {request.user.role} not allowed")
                return False
            if hasattr(request, 'finance_shift_info'):
                shift_info = request.finance_shift_info
                model_name = obj.__class__.__name__
                if model_name in FINANCE_PERMISSION_RULES['data_fields']:
                    data_field = FINANCE_PERMISSION_RULES['data_fields'][model_name]
                    if getattr(obj, data_field, None) != request.user:
                        logger.warning(f"Object {model_name} not created by user: {request.user.username}")
                        return False
                    date_field = getattr(obj, 'date', getattr(obj, 'created_at', None))
                    if date_field and (date_field < shift_info['shift_start'] or date_field > shift_info['shift_end']):
                        logger.warning(f"Object {model_name} outside shift: {date_field}")
                        return False
                return club == request.user.club
            return False

        # Non-finance handling
        if request.user.role in self.FULL_ACCESS_ROLES:
            return club == request.user.club

        if request.user.role not in self.LIMITED_ACCESS_ROLES or (
            request.method not in permissions.SAFE_METHODS and request.method != 'POST'
        ):
            logger.warning(f"Invalid role or method: Role={request.user.role}, Method={request.method}")
            return False

        attendance = StaffAttendance.objects.filter(
            staff=request.user, club=request.user.club, check_out__isnull=True
        ).order_by('-check_in').first()
        if not attendance:
            logger.warning(f"No active shift for user: {request.user.username}")
            return False

        if request.method in permissions.SAFE_METHODS:
            is_created_by_user = (
                getattr(obj, 'created_by', None) == request.user or
                getattr(obj, 'paid_by', None) == request.user or
                getattr(obj, 'received_by', None) == request.user
            )
            if not is_created_by_user:
                logger.warning(f"Object not created by user: {request.user.username}")
                return False
            date_field = getattr(obj, 'date', getattr(obj, 'created_at', None))
            if date_field and (date_field < attendance.check_in or date_field > (attendance.check_out or timezone.now())):
                logger.warning(f"Object outside shift: {date_field}")
                return False
            return True

        return club == request.user.club