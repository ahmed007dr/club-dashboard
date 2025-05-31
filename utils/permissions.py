from rest_framework import permissions
from staff.models import StaffAttendance
from django.utils import timezone
from finance.models import Income, Expense

class IsOwnerOrRelatedToClub(permissions.BasePermission):
    """
    Custom permission to allow:
    - Owners and Admins (role='owner' or 'admin') to perform GET, POST, PUT, DELETE
      on objects associated with their club.
    - Other roles (e.g., reception, accountant) to perform only GET and POST
      on objects associated with their club, within their active shift for Income/Expense.
    - Objects with no 'club' attribute are checked for 'subscription.club' (e.g., Attendance).
    - Non-owners/admins are denied access for PUT/DELETE.
    """
    def has_permission(self, request, view):
        """
        Check if the user is authenticated and has an associated club.
        """
        return request.user and request.user.is_authenticated and request.user.club is not None

    def has_object_permission(self, request, view, obj):
        """
        Check if the user has permission to access the specific object.
        - Owners and Admins can perform all actions on objects for their club.
        - Other roles can only perform GET and POST, with shift validation for Income/Expense.
        - If the object has a 'subscription' with a 'club', check that instead (e.g., Attendance).
        - Deny access for objects with no club or subscription.club for safety.
        """
        # Deny access if user has no associated club
        if not request.user.club:
            return False
        
        # Check if object has a 'club' attribute
        if hasattr(obj, 'club') and obj.club:
            # Owners and Admins can perform all actions on their club
            if request.user.role in ['owner', 'admin']:
                return obj.club == request.user.club
            # Other roles can only perform GET and POST
            if request.method in permissions.SAFE_METHODS or request.method == 'POST':
                # For Income/Expense, check shift and ownership
                if isinstance(obj, (Income, Expense)):
                    attendance = StaffAttendance.objects.filter(
                        staff=request.user,
                        club=request.user.club
                    ).order_by('-check_in').first()
                    
                    if not attendance:
                        return False
                    
                    check_out = attendance.check_out if attendance.check_out else timezone.now()
                    is_within_shift = obj.date >= attendance.check_in and obj.date <= check_out
                    is_owned_by_user = (
                        (isinstance(obj, Income) and obj.received_by == request.user) or
                        (isinstance(obj, Expense) and obj.paid_by == request.user)
                    )
                    return obj.club == request.user.club and is_within_shift and is_owned_by_user
                return obj.club == request.user.club
            return False  # Deny PUT/DELETE for non-owners/admins
        
        # Check if object has a 'subscription' with a 'club'
        if hasattr(obj, 'subscription') and obj.subscription and hasattr(obj.subscription, 'club') and obj.subscription.club:
            if request.user.role in ['owner', 'admin']:
                return obj.subscription.club == request.user.club
            if request.method in permissions.SAFE_METHODS or request.method == 'POST':
                return obj.subscription.club == request.user.club
            return False  # Deny PUT/DELETE for non-owners/admins
        
        # Deny access by default for objects with no club or subscription.club
        return False