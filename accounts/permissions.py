from rest_framework.permissions import BasePermission

ALLOWED_ROLES = ['owner', 'admin', 'reception']

class IsAllowedRole(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ALLOWED_ROLES