from django.contrib import admin
from .models import GroupPermission

@admin.register(GroupPermission)
class GroupPermissionAdmin(admin.ModelAdmin):
    list_display = ('group', 'resource', 'can_view', 'can_create', 'can_edit', 'can_delete', 'shift_restricted', 'allow_old_data_search')
    list_filter = ('group', 'resource', 'can_view', 'can_create', 'can_edit', 'can_delete', 'shift_restricted')
    search_fields = ('group__name', 'resource')
    list_editable = ('can_view', 'can_create', 'can_edit', 'can_delete', 'shift_restricted', 'allow_old_data_search')