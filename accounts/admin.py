from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group, Permission
from .models import User
from core.models import Club

# Custom admin action to activate/deactivate users
@admin.action(description="Activate selected users")
def activate_users(modeladmin, request, queryset):
    queryset.update(is_active=True)

@admin.action(description="Deactivate selected users")
def deactivate_users(modeladmin, request, queryset):
    queryset.update(is_active=False)

@admin.action(description="Assign 'Admin' role to selected users")
def assign_admin_role(modeladmin, request, queryset):
    queryset.update(role='admin')

# Inline for Groups
class GroupInline(admin.TabularInline):
    model = User.groups.through
    extra = 1
    verbose_name = "Group Membership"
    verbose_name_plural = "Group Memberships"

# Inline for User Permissions
class PermissionInline(admin.TabularInline):
    model = User.user_permissions.through
    extra = 1
    verbose_name = "User Permission"
    verbose_name_plural = "User Permissions"

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Fields to display in the list view
    list_display = ('username', 'email', 'role', 'club', 'is_active', 'is_staff', 'last_login')
    list_filter = ('role', 'club', 'is_active', 'is_staff', 'groups')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_per_page = 25

    # Fields to display in the add/edit form
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email', 'role', 'club')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'club', 'is_active', 'is_staff'),
        }),
    )

    # Read-only fields
    readonly_fields = ('last_login', 'date_joined')

    # Inlines for groups and permissions
    inlines = [GroupInline, PermissionInline]

    # Custom actions
    actions = [activate_users, deactivate_users, assign_admin_role]

    # Ordering
    ordering = ('username',)

    # Customize the formfield for club to show a more descriptive choice
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'club':
            kwargs['queryset'] = Club.objects.order_by('name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    # Optional: Add custom CSS for styling
    class Media:
        css = {
            'all': ('css/admin_custom.css',)
        }

# # Optional: Unregister the default Group and Permission admin to avoid clutter
# admin.site.unregister(Group)
# admin.site.unregister(Permission)