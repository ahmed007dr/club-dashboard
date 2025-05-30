from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import PayrollPeriod, EmployeeContract, CoachPercentage, PayrollDeduction, Payroll
from core.models import Club

User = get_user_model()

# Custom admin filter to restrict records to the user's club
class ClubRestrictedAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser and request.user.club:
            # Restrict queryset to the user's club
            return queryset.filter(club=request.user.club)
        return queryset

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        # Restrict club choices to the user's club
        if db_field.name == "club" and not request.user.is_superuser and request.user.club:
            kwargs["queryset"] = Club.objects.filter(id=request.user.club.id)
        # Restrict employee/coach choices to users associated with the user's club
        elif db_field.name in ["employee", "coach"] and not request.user.is_superuser and request.user.club:
            kwargs["queryset"] = User.objects.filter(club=request.user.club)
        # Restrict payroll choices to payrolls associated with the user's club
        elif db_field.name == "payroll" and not request.user.is_superuser and request.user.club:
            kwargs["queryset"] = Payroll.objects.filter(club=request.user.club)
        # Restrict period choices to periods associated with the user's club
        elif db_field.name == "period" and not request.user.is_superuser and request.user.club:
            kwargs["queryset"] = PayrollPeriod.objects.filter(club=request.user.club)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def has_add_permission(self, request):
        # Allow adding records only if user is associated with a club
        return request.user.is_staff and request.user.club is not None

    def has_change_permission(self, request, obj=None):
        # Allow changing records only if they belong to the user's club
        if obj and not request.user.is_superuser and request.user.club:
            return obj.club == request.user.club
        return request.user.is_staff

    def has_delete_permission(self, request, obj=None):
        # Allow deleting records only if they belong to the user's club
        if obj and not request.user.is_superuser and request.user.club:
            return obj.club == request.user.club
        return request.user.is_staff

@admin.register(PayrollPeriod)
class PayrollPeriodAdmin(ClubRestrictedAdmin):
    list_display = ('club', 'start_date', 'end_date', 'is_active', 'created_at')
    list_filter = ('club', 'is_active', 'start_date', 'end_date')
    search_fields = ('club__name', 'start_date', 'end_date')
    date_hierarchy = 'start_date'
    ordering = ('-start_date',)

    def get_readonly_fields(self, request, obj=None):
        # Make is_active readonly when editing to avoid accidental changes
        if obj:
            return ('is_active',)
        return ()

@admin.register(EmployeeContract)
class EmployeeContractAdmin(ClubRestrictedAdmin):
    list_display = ('employee', 'club', 'hourly_rate', 'start_date', 'end_date', 'created_at')
    list_filter = ('club', 'start_date', 'end_date')
    search_fields = ('employee__username', 'club__name', 'hourly_rate')
    date_hierarchy = 'start_date'
    ordering = ('-start_date',)

@admin.register(CoachPercentage)
class CoachPercentageAdmin(ClubRestrictedAdmin):
    list_display = ('coach', 'club', 'coach_percentage', 'club_percentage', 'effective_date', 'created_at')
    list_filter = ('club', 'effective_date')
    search_fields = ('coach__username', 'club__name', 'coach_percentage')
    date_hierarchy = 'effective_date'
    ordering = ('-effective_date',)

@admin.register(PayrollDeduction)
class PayrollDeductionAdmin(ClubRestrictedAdmin):
    list_display = ('payroll', 'amount', 'reason', 'created_at')
    list_filter = ('payroll__club', 'created_at')
    search_fields = ('payroll__employee__username', 'reason', 'amount')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

@admin.register(Payroll)
class PayrollAdmin(ClubRestrictedAdmin):
    list_display = (
        'employee', 'club', 'period', 'expected_hours', 'actual_hours', 
        'base_salary', 'private_earnings', 'bonuses', 'total_deductions', 
        'total_salary', 'is_finalized', 'created_at'
    )
    list_filter = ('club', 'period', 'is_finalized', 'created_at')
    search_fields = ('employee__username', 'club__name', 'period__start_date')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    actions = ['finalize_selected_payrolls']

    def finalize_selected_payrolls(self, request, queryset):
        """Finalize selected payrolls that are not already finalized."""
        count = 0
        for payroll in queryset.filter(is_finalized=False):
            payroll.finalize()
            count += 1
        self.message_user(request, f"Successfully finalized {count} payrolls.")
    finalize_selected_payrolls.short_description = "Finalize selected payrolls"

    def get_readonly_fields(self, request, obj=None):
        # Make calculated fields readonly
        if obj:
            return (
                'actual_hours', 'absent_hours', 'base_salary', 'absence_deduction',
                'private_earnings', 'total_deductions', 'total_salary', 'is_finalized'
            )
        return ()