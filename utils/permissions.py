from rest_framework import permissions
from staff.models import StaffAttendance
from django.utils import timezone
from datetime import timedelta
from utils.finance_permissions import apply_finance_permissions

class IsOwnerOrRelatedToClub(permissions.BasePermission):
    """
    Custom permission for club-related access with finance-specific exceptions.
    """
    FULL_ACCESS_ROLES = ['owner', 'admin']
    LIMITED_ACCESS_ROLES = ['reception', 'accounting', 'coach']
    DATA_VISIBLE_DAYS = 7
    SEARCH_PARAMS = [
        'q', 'search', 'search_term', 'identifier', 'member_id', 'type_id', 'club_id', 'club_name', 'start_date', 'end_date',
        'paid_amount', 'remaining_amount', 'entry_count', 'status', 'rfid', 'member_name', 'attendance_date', 'timestamp',
        'member', 'club', 'staff_search', 'date', 'date_min', 'date_max', 'name', 'ticket_type', 'issue_date', 'description',
        'amount', 'source', 'category', 'user', 'employee_id', 'stock_item_id', 'period_type', 'guest_name', 'invoice_number'
    ]

    def _get_club(self, obj):
        """Resolve club from object or its subscription."""
        club = getattr(obj, 'club', None)
        if not club and hasattr(obj, 'subscription') and obj.subscription:
            club = getattr(obj.subscription, 'club', None)
        return club

    def has_permission(self, request, view):
        """Ensure user is authenticated and has a club."""
        if not request.user.is_authenticated or not request.user.club:
            return False

        # Apply finance-specific permissions if view is in finance app
        if view.__module__.startswith('finance.views'):
            finance_perm = apply_finance_permissions(view, request)
            if finance_perm and isinstance(finance_perm, dict):
                # Store shift info for later use in has_object_permission
                request.finance_shift_info = finance_perm
                return True
            elif finance_perm is None:
                return True
            return False

        return True

    def has_object_permission(self, request, view, obj):
        """Check object-level access based on role, shift, and finance rules."""
        club = self._get_club(obj)
        if not club or not request.user.club:
            return False

        # Finance-specific handling
        if view.__module__.startswith('finance.views'):
            if view.__name__ in FINANCE_PERMISSION_RULES['exempt_views']:
                return club == request.user.club

            if request.user.role in self.FULL_ACCESS_ROLES:
                return club == request.user.club

            if request.user.role not in self.LIMITED_ACCESS_ROLES:
                return False

            if hasattr(request, 'finance_shift_info'):
                shift_info = request.finance_shift_info
                model_name = obj.__class__.__name__
                if model_name in FINANCE_PERMISSION_RULES['data_fields']:
                    data_field = FINANCE_PERMISSION_RULES['data_fields'][model_name]
                    if getattr(obj, data_field, None) != request.user:
                        return False
                    date_field = getattr(obj, 'date', getattr(obj, 'created_at', None))
                    if date_field and (date_field < shift_info['shift_start'] or date_field > shift_info['shift_end']):
                        return False
                return club == request.user.club

            return False

        # Non-finance handling (fallback to original logic)
        if request.user.role in self.FULL_ACCESS_ROLES:
            return club == request.user.club

        if request.user.role not in self.LIMITED_ACCESS_ROLES or (
            request.method not in permissions.SAFE_METHODS and request.method != 'POST'
        ):
            return False

        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if any(request.query_params.get(param) for param in self.SEARCH_PARAMS):
            return club == request.user.club

        if not attendance:
            return False

        if request.method in permissions.SAFE_METHODS:
            is_created_by_user = (
                getattr(obj, 'created_by', None) == request.user or
                getattr(obj, 'approved_by', None) == request.user or
                getattr(obj, 'issued_by', None) == request.user or
                getattr(obj, 'paid_by', None) == request.user or
                getattr(obj, 'received_by', None) == request.user or
                (hasattr(obj, 'shift') and getattr(obj.shift, 'approved_by', None) == request.user)
            )
            if is_created_by_user:
                return club == request.user.club

            date_field = getattr(obj, 'attendance_date', getattr(obj, 'timestamp', getattr(obj, 'start_date', getattr(obj, 'created_at', getattr(obj, 'date', getattr(obj, 'check_in', getattr(obj, 'issue_datetime', None)))))))
            if date_field:
                period_start = timezone.now() - timedelta(days=self.DATA_VISIBLE_DAYS)
                is_within_period = date_field >= period_start
                return club == request.user.club and is_within_period
            return club == request.user.club

        return club == request.user.club