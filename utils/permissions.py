from rest_framework.permissions import BasePermission
from staff.models import StaffAttendance
from django.utils import timezone
from finance.models import Income , Expense
class IsOwnerOrRelatedToClub(BasePermission):
    """
    Custom permission to allow:
    - Owners and Admins (role='owner' or 'admin') to access all data for their associated club.
    - Other roles (e.g., reception, accountant) to access only data related to their associated club
      and their active shift (for Income/Expense objects).
    - If the object has no 'club' attribute, check for 'subscription.club' (e.g., Attendance).
    - If neither exists, non-owners/admins are denied access for safety.
    """
    def has_permission(self, request, view):
        """
        Check if the user is authenticated to access the view.
        """
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """
        Check if the user has permission to access the specific object.
        - Owners and Admins can access objects associated with their club.
        - Other roles can only access objects associated with their club and their active shift
          (for Income/Expense objects).
        - If the object has a 'subscription' with a 'club', check that instead (e.g., Attendance).
        - Deny access by default for objects with no club or subscription.club for non-owners/admins.
        """
        # Deny access if user has no associated club
        if not request.user.club:
            return False
        
        # Check if object has a 'club' attribute
        if hasattr(obj, 'club') and obj.club:
            if request.user.role in ['owner', 'admin']:
                # Owners and Admins can access any object for their club
                return obj.club == request.user.club
            else:
                # Reception and Accountant can access only their own Income/Expense within their shift
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
        
        # Check if object has a 'subscription' with a 'club'
        if hasattr(obj, 'subscription') and obj.subscription and hasattr(obj.subscription, 'club') and obj.subscription.club:
            return obj.subscription.club == request.user.club
        
        # Deny access by default for objects with no club or subscription.club
        return False