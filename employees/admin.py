from django.contrib import admin
from import_export.admin import ExportMixin
from import_export import resources
from django.utils.html import format_html
from django.contrib.auth.models import Group
from .models import Employee, EmployeeSalary, EmployeeTransaction, Supplier, SupplierInvoice
from django.contrib.admin import SimpleListFilter

# ✅ Resources for export/import
class EmployeeResource(resources.ModelResource):
    class Meta:
        model = Employee
        fields = ('id', 'club__name', 'full_name', 'date_of_birth', 'card_number', 'phone_number', 'phone_number_2', 'address', 'notes', 'hire_date', 'rfid_code', 'default_hourly_rate', 'default_expected_hours', 'role', 'job_title', 'gender')

class EmployeeSalaryResource(resources.ModelResource):
    class Meta:
        model = EmployeeSalary
        fields = ('id', 'employee__full_name', 'club__name', 'month', 'worked_hours', 'amount', 'is_locked', 'created_at')

class EmployeeTransactionResource(resources.ModelResource):
    class Meta:
        model = EmployeeTransaction
        fields = ('id', 'employee__full_name', 'club__name', 'amount', 'transaction_type', 'description', 'date', 'invoice_number')

class SupplierResource(resources.ModelResource):
    class Meta:
        model = Supplier
        fields = ('id', 'club__name', 'name', 'contact_info', 'balance', 'created_at')

class SupplierInvoiceResource(resources.ModelResource):
    class Meta:
        model = SupplierInvoice
        fields = ('id', 'supplier__name', 'club__name', 'amount', 'description', 'date', 'invoice_number', 'is_paid')

# ✅ Custom filter for role
class RoleFilter(SimpleListFilter):
    title = 'الدور'
    parameter_name = 'role'

    def lookups(self, request, model_admin):
        # تعريف الخيارات المتاحة بناءً على choices في الموديل
        return [
            ('coach', 'كوتش'),
            ('reception', 'ريسيبشن'),
            ('cleaning', 'عمال نظافة'),
            ('external', 'موظفين خارجيين'),
            ('other', 'آخرون'),
        ]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(role=self.value())
        return queryset

# ✅ Admin actions
@admin.action(description="Activate employee salaries")
def activate_salaries(modeladmin, request, queryset):
    queryset.update(is_locked=False)

@admin.action(description="Lock selected salaries")
def lock_salaries(modeladmin, request, queryset):
    queryset.update(is_locked=True)

@admin.action(description="Mark invoices as paid")
def mark_invoices_paid(modeladmin, request, queryset):
    queryset.update(is_paid=True)

# ✅ Custom Admin for Employee with Group Management
@admin.register(Employee)
class EmployeeAdmin(ExportMixin, admin.ModelAdmin):
    resource_class = EmployeeResource
    list_display = ('full_name', 'club', 'hire_date', 'default_hourly_rate', 'get_role', 'job_title', 'gender', 'date_of_birth', 'card_number', 'phone_number', 'phone_number_2', 'address')
    list_filter = ('club', 'hire_date', 'gender', RoleFilter)  # استخدام الفلتر المخصص
    search_fields = ('full_name', 'card_number', 'phone_number', 'phone_number_2', 'address', 'role', 'job_title')
    list_per_page = 25
    filter_horizontal = ('groups',)

    def get_role(self, obj):
        """Custom method to display role in admin."""
        return obj.get_role_display()  # استخدام get_role_display للـ ChoiceField
    get_role.short_description = 'الدور'

@admin.register(EmployeeSalary)
class EmployeeSalaryAdmin(ExportMixin, admin.ModelAdmin):
    resource_class = EmployeeSalaryResource
    list_display = ('employee', 'club', 'month', 'worked_hours', 'amount', 'is_locked')
    list_filter = ('club', 'is_locked', 'month')
    search_fields = ('employee__full_name',)
    list_per_page = 25
    actions = [activate_salaries, lock_salaries]

@admin.register(EmployeeTransaction)
class EmployeeTransactionAdmin(ExportMixin, admin.ModelAdmin):
    resource_class = EmployeeTransactionResource
    list_display = ('employee', 'club', 'amount', 'transaction_type', 'date')
    list_filter = ('club', 'transaction_type', 'date')
    search_fields = ('employee__full_name', 'description')
    list_per_page = 25

@admin.register(Supplier)
class SupplierAdmin(ExportMixin, admin.ModelAdmin):
    resource_class = SupplierResource
    list_display = ('name', 'club', 'balance', 'created_at')
    list_filter = ('club',)
    search_fields = ('name', 'contact_info')
    list_per_page = 25

@admin.register(SupplierInvoice)
class SupplierInvoiceAdmin(ExportMixin, admin.ModelAdmin):
    resource_class = SupplierInvoiceResource
    list_display = ('supplier', 'club', 'amount', 'date', 'invoice_number', 'is_paid')
    list_filter = ('club', 'is_paid', 'date')
    search_fields = ('supplier__name', 'invoice_number')
    list_per_page = 25
    actions = [mark_invoices_paid]