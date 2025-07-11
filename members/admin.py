from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget
from .models import Member
from core.models import Club
from subscriptions.models import Subscription
from .resources import MemberResource


class MemberResource(resources.ModelResource):
    club__name = fields.Field(
        column_name='club__name',
        attribute='club',
        widget=ForeignKeyWidget(Club, 'name')
    )

    class Meta:
        model = Member
        fields = (
            'id', 'name', 'membership_number', 'rfid_code', 'national_id', 
            'phone', 'phone2', 'birth_date', 'job', 'address', 'note', 
            'gender', 'club__name', 'created_at' 
        )
        export_order = fields

class SubscriptionInline(admin.TabularInline):
    model = Subscription
    extra = 0
    fields = ('type', 'start_date', 'end_date', 'paid_amount')
    readonly_fields = ('start_date', 'end_date')
    raw_id_fields = ('type',)

@admin.register(Member)
class MemberAdmin(ImportExportModelAdmin):
    resource_class = MemberResource
    list_display = (
        'name', 'membership_number', 'rfid_code', 'club', 'phone', 
        'job', 'gender', 'created_at' 
    )
    list_filter = ('club', 'created_at', 'job', 'gender')
    search_fields = (
        'name', 'membership_number', 'rfid_code', 
        'national_id', 'phone', 'phone2', 'gender'
    )
    date_hierarchy = 'created_at'
    raw_id_fields = ('referred_by',)
    inlines = [SubscriptionInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if hasattr(request.user, 'role') and request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs