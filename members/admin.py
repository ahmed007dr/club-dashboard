from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from .models import Member
from subscriptions.models import Subscription

# Resource for import/export
class MemberResource(resources.ModelResource):
    class Meta:
        model = Member
        fields = (
            'id', 'name', 'membership_number', 'rfid_code', 'national_id', 
            'phone', 'phone2', 'birth_date', 'job', 'address', 'note', 
            'club__name', 'created_at'
        )
        export_order = fields

# Inline subscription display
class SubscriptionInline(admin.TabularInline):
    model = Subscription
    extra = 0
    fields = ('type', 'start_date', 'end_date', 'paid_amount')
    readonly_fields = ('start_date', 'end_date')
    raw_id_fields = ('type',)

# Main Member admin
@admin.register(Member)
class MemberAdmin(ImportExportModelAdmin):
    resource_class = MemberResource
    list_display = (
        'name', 'membership_number', 'rfid_code', 'club', 'phone', 
        'job', 'created_at'
    )
    list_filter = ('club', 'created_at', 'job')
    search_fields = (
        'name', 'membership_number', 'rfid_code', 
        'national_id', 'phone', 'phone2'
    )
    date_hierarchy = 'created_at'
    raw_id_fields = ('referred_by',)
    inlines = [SubscriptionInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if hasattr(request.user, 'role') and request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs
