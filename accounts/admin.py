from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group, Permission
from import_export.admin import ExportMixin
from import_export import resources
from django.utils.html import format_html

from .models import User
from core.models import Club

# ✅ Resource for export/import
class UserResource(resources.ModelResource):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'club__name', 'is_active', 'is_staff', 'date_joined')

# ✅ Admin actions
@admin.action(description="Activate selected users")
def activate_users(modeladmin, request, queryset):
    queryset.update(is_active=True)

@admin.action(description="Deactivate selected users")
def deactivate_users(modeladmin, request, queryset):
    queryset.update(is_active=False)

@admin.action(description="Assign 'Admin' role to selected users")
def assign_admin_role(modeladmin, request, queryset):
    queryset.update(role='admin')

# ✅ Inlines
class GroupInline(admin.TabularInline):
    model = User.groups.through
    extra = 1
    verbose_name = "Group Membership"
    verbose_name_plural = "Group Memberships"

class PermissionInline(admin.TabularInline):
    model = User.user_permissions.through
    extra = 1
    verbose_name = "User Permission"
    verbose_name_plural = "User Permissions"

# ✅ Custom Admin
@admin.register(User)
class CustomUserAdmin(ExportMixin, UserAdmin):
    resource_class = UserResource

    list_display = ('username', 'email', 'first_name', 'last_name', 'role_colored', 'club', 'is_active', 'is_staff', 'last_login')
    list_filter = ('role', 'club', 'is_active', 'is_staff', 'groups')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_per_page = 25
    ordering = ('username',)
    readonly_fields = ('last_login', 'date_joined')
    actions = [activate_users, deactivate_users, assign_admin_role]
    inlines = [GroupInline, PermissionInline]

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email', 'role', 'club', 'rfid_code')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'club', 'rfid_code', 'is_active', 'is_staff'),
        }),
    )

    def role_colored(self, obj):
        color_map = {
            'owner': 'darkred',
            'admin': 'blue',
            'reception': 'green',
            'accountant': 'purple',
            'coach': 'orange',
        }
        color = color_map.get(obj.role, 'black')
        return format_html(f'<b style="color:{color}">{obj.get_role_display()}</b>')
    role_colored.short_description = 'Role'

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'club':
            kwargs['queryset'] = Club.objects.order_by('name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
