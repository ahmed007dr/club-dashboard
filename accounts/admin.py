from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group, Permission
from import_export.admin import ExportMixin
from import_export import resources
from django.utils.html import format_html

from .models import User
from core.models import Club

# ✅ Export/Import resource
class UserResource(resources.ModelResource):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'club__name', 'rfid_code', 'is_active', 'is_staff',
            'date_joined', 'can_login'
        )

# ✅ Admin actions
@admin.action(description="تفعيل المستخدمين المحددين")
def activate_users(modeladmin, request, queryset):
    queryset.update(is_active=True)

@admin.action(description="تعطيل المستخدمين المحددين")
def deactivate_users(modeladmin, request, queryset):
    queryset.update(is_active=False)

@admin.action(description="تعيين الدور Admin")
def assign_admin_role(modeladmin, request, queryset):
    queryset.update(role='admin')

@admin.action(description="السماح بالدخول للنظام")
def allow_login(modeladmin, request, queryset):
    queryset.update(can_login=True)

@admin.action(description="منع الدخول للنظام")
def disable_login(modeladmin, request, queryset):
    queryset.update(can_login=False)

# ✅ Inlines
class GroupInline(admin.TabularInline):
    model = User.groups.through
    extra = 1

class PermissionInline(admin.TabularInline):
    model = User.user_permissions.through
    extra = 1

# ✅ User admin
@admin.register(User)
class CustomUserAdmin(ExportMixin, UserAdmin):
    resource_class = UserResource

    list_display = (
        'username', 'email', 'first_name', 'last_name',
        'role_colored', 'club', 'rfid_code', 'is_active', 'is_staff',
        'can_login', 'last_login'
    )
    list_filter = ('role', 'club', 'is_active', 'is_staff', 'groups', 'can_login')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'rfid_code')
    list_per_page = 25
    ordering = ('username',)
    readonly_fields = ('last_login', 'date_joined')
    actions = [activate_users, deactivate_users, assign_admin_role, allow_login, disable_login]
    inlines = [GroupInline, PermissionInline]

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('معلومات شخصية', {
            'fields': (
                'first_name', 'last_name', 'email',
                'role', 'club', 'rfid_code', 'can_login'
            )
        }),
        ('الصلاحيات', {
            'fields': (
                'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions'
            )
        }),
        ('تواريخ مهمة', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'role', 'club', 'rfid_code', 'is_active', 'is_staff', 'can_login'
            ),
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
    role_colored.short_description = 'الدور'

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'club':
            kwargs['queryset'] = Club.objects.order_by('name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
