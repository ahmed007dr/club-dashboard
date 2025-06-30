from rest_framework import permissions
from .models import GroupPermission
from staff.models import StaffAttendance
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

RESOURCE_MAPPING = {
    # attendance
    'attendance_list_api': 'attendance',
    'missing_checkins_api': 'attendance',
    'staff_check_in_by_code_api': 'attendance',
    'staff_check_out_by_code_api': 'attendance',

    # attendance_analysis
    'staff_attendance_analysis_api': 'attendance_analysis',

    # attendance_reports
    'staff_attendance_report_api': 'attendance_reports',

    # clubs
    'api_club_profile': 'clubs',
    'api_edit_club': 'clubs',
    'api_list_clubs': 'clubs',
    'api_switch_club': 'clubs',

    # coaches
    'coach_list': 'coaches',

    # coach_reports
    'coach_report': 'coach_reports',

    # features
    'feature_list': 'features',

    # freeze_requests
    'cancel_freeze': 'freeze_requests',
    'request_freeze': 'freeze_requests',

    # payments
    'make_payment': 'payments',

    # shifts
    'add_shift_api': 'shifts',
    'delete_shift_api': 'shifts',
    'edit_shift_api': 'shifts',
    'shift_detail_api': 'shifts',
    'shift_list_api': 'shifts',
    'staff_shifts_api': 'shifts',

    # special_offers
    'special_offer_detail': 'special_offers',
    'special_offer_list': 'special_offers',

    # staff
    'staff_list_api': 'staff',

    # subscriptions
    'active_subscriptions': 'subscriptions',
    'cancel_subscription': 'subscriptions',
    'expired_subscriptions': 'subscriptions',
    'member_subscriptions': 'subscriptions',
    'renew_subscription': 'subscriptions',
    'subscription_analytics': 'subscriptions',
    'subscription_detail': 'subscriptions',
    'subscription_list': 'subscriptions',
    'subscription_stats': 'subscriptions',
    'upcoming_subscriptions': 'subscriptions',

    # subscription_types
    'active_subscription_types': 'subscription_types',
    'subscription_type_detail': 'subscription_types',
    'subscription_type_list': 'subscription_types',

    # users
    'active_users_api': 'users',
    'api_user_create': 'users',
    'api_user_list': 'users',
    'api_user_profile': 'users',
    'api_user_update': 'users',

    # payment_methods
    'payment_method_detail': 'payment_methods',
    'payment_method_list': 'payment_methods',
}


class IsOwnerOrRelatedToClub(permissions.BasePermission):
    FULL_ACCESS_ROLES = ['owner', 'admin']

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
        if view_name in ['staff_check_in_by_code_api', 'staff_check_out_by_code_api']:
            logger.debug(f"Allowing access to {view_name} for user: {request.user.username}")
            return True

        if not request.user.club:
            logger.error(f"User {request.user.username} has no associated club")
            return False

        resource = getattr(view, 'basename', RESOURCE_MAPPING.get(view_name, view_name))
        perm = None
        for group in request.user.groups.all():
            perm = GroupPermission.objects.filter(group=group, resource=resource).first()
            if perm:
                break

        if not perm:
            logger.warning(f"No group permissions for {resource} for user: {request.user.username}")
            return request.user.role in self.FULL_ACCESS_ROLES

        if request.method in permissions.SAFE_METHODS:
            if not perm.can_view:
                logger.warning(f"View permission denied for {resource}")
                return False
            if perm.shift_restricted and request.user.role not in self.FULL_ACCESS_ROLES:
                attendance = StaffAttendance.objects.filter(
                    staff=request.user, club=request.user.club, check_out__isnull=True
                ).order_by('-check_in').first()
                if not attendance:
                    if perm.allow_old_data_search and 'search' in request.GET:
                        request.is_search_old_data = True
                        return True
                    logger.warning(f"No active shift for user: {request.user.username}")
                    return False
                request.shift_info = {'start': attendance.check_in, 'end': timezone.now()}
            return True

        if request.method == 'POST' and not perm.can_create:
            logger.warning(f"Create permission denied for {resource}")
            return False
        if request.method in ['PUT', 'PATCH'] and not perm.can_edit:
            logger.warning(f"Edit permission denied for {resource}")
            return False
        if request.method == 'DELETE' and not perm.can_delete:
            logger.warning(f"Delete permission denied for {resource}")
            return False

        if perm.shift_restricted and request.method not in permissions.SAFE_METHODS:
            if request.user.role not in self.FULL_ACCESS_ROLES:
                attendance = StaffAttendance.objects.filter(
                    staff=request.user, club=request.user.club, check_out__isnull=True
                ).order_by('-check_in').first()
                if not attendance:
                    logger.warning(f"No active shift for user: {request.user.username}")
                    return False
                request.shift_info = {'start': attendance.check_in, 'end': timezone.now()}
        return True

    def has_object_permission(self, request, view, obj):
        view_name = getattr(view, '__name__', getattr(view.__class__, '__name__', ''))
        resource = getattr(view, 'basename', RESOURCE_MAPPING.get(view_name, view_name))
        perm = None
        for group in request.user.groups.all():
            perm = GroupPermission.objects.filter(group=group, resource=resource).first()
            if perm:
                break

        club = self._get_club(obj)
        if not perm or not club or club != request.user.club:
            logger.error(f"Permission or club mismatch: {resource}, user: {request.user.username}")
            return False

        if request.method in permissions.SAFE_METHODS:
            if not perm.can_view:
                return False
            if perm.shift_restricted and request.user.role not in self.FULL_ACCESS_ROLES:
                attendance = StaffAttendance.objects.filter(
                    staff=request.user, club=request.user.club, check_out__isnull=True
                ).order_by('-check_in').first()
                if not attendance:
                    if perm.allow_old_data_search and hasattr(request, 'is_search_old_data') and request.is_search_old_data:
                        return True
                    logger.warning(f"No active shift for user: {request.user.username}")
                    return False
                date_field = getattr(obj, 'created_at', getattr(obj, 'start_date', None))
                if date_field and date_field < attendance.check_in:
                    logger.warning(f"Object outside shift: {date_field}")
                    return False
            return True

        if request.method == 'PUT' and not perm.can_edit:
            return False
        if request.method == 'DELETE' and not perm.can_delete:
            return False

        return club == request.user.club