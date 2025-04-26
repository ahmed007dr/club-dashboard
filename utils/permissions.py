from rest_framework.permissions import BasePermission

class IsOwnerOrRelatedToClub(BasePermission):
    """
    Custom permission to allow:
    - Owners (role='owner') to access all data across all clubs.
    - Other roles to access only data related to their associated club.
    - If the object has no 'club' attribute, check for 'subscription.club' (e.g., Attendance).
    - If neither exists, non-owners can access it.
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
        - If neither exists, non-owners can access it.
        """
        # Check if user is an Owner (based on role only)
        if request.user.role == 'owner':
            return True
        
        # Check if the object has a 'club' attribute (e.g., EntryLog, Expense, etc.)
        if hasattr(obj, 'club') and obj.club:
            return obj.club == request.user.club
        
        # Check if the object has a 'subscription' with a 'club' (e.g., Attendance)
        if hasattr(obj, 'subscription') and obj.subscription and hasattr(obj.subscription, 'club') and obj.subscription.club:
            return obj.subscription.club == request.user.club
        
        # If the object has neither 'club' nor 'subscription.club' (e.g., SubscriptionType), allow access for non-owners
        return True