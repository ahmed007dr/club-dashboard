from rest_framework.permissions import BasePermission



class IsAdminOrOwnerForClub(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        is_admin = request.user.is_staff
        is_owner = request.user.role == 'owner'
        if not (is_admin or is_owner):
            return False
        
        # Check if user is associated with a club        if not request.user.club:
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'club'):
            return obj.club == request.user.club
        return False
    

class IsOwnerOrRelatedToClub(BasePermission):
    """
    Custom permission to allow:
    - Owners (role='owner') to access all data across all clubs.
    - Other roles to access only data related to their associated club.
    - If the object has no 'club' attribute, check for 'subscription.club' (e.g., Attendance).
    - If neither exists, non-owners are denied access for safety.
    """
    def has_permission(self, request, view):
        """
        Check if the user is authenticated to access the view.
        """
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """
        Check if the user has permission to access the specific object.
        - Owners have full access.
        - If the object has a 'club' attribute, non-owners can only access objects associated with their club.
        - If the object has a 'subscription' with a 'club', check that instead (e.g., Attendance).
        - If neither exists, non-owners are denied access.
        """
        # Owners have full access
        if request.user.role == 'owner':
            return True
        
        # Deny access if user has no associated club
        if not request.user.club:
            return False
        
        # Check if object has a 'club' attribute
        if hasattr(obj, 'club') and obj.club:
            return obj.club == request.user.club
        
        # Check if object has a 'subscription' with a 'club'
        if hasattr(obj, 'subscription') and obj.subscription and hasattr(obj.subscription, 'club') and obj.subscription.club:
            return obj.subscription.club == request.user.club
        
        # Deny access by default for objects with no club or subscription.club
        return False
