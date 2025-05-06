from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from .models import Ticket
from django.utils.html import format_html
from datetime import date


# Resource for import/export
class TicketResource(resources.ModelResource):
    class Meta:
        model = Ticket
        fields = (
            'id', 'club__name', 'buyer_name', 'ticket_type', 'price',
            'used', 'issue_date', 'used_by__name'
        )
        export_order = (
            'id', 'club__name', 'buyer_name', 'ticket_type', 'price',
            'used', 'issue_date', 'used_by__name'
        )


@admin.register(Ticket)
class TicketAdmin(ImportExportModelAdmin):
    resource_class = TicketResource
    list_display = (
        'colored_buyer', 'ticket_type', 'price', 'used', 'club', 'issue_date', 'used_by'
    )
    list_filter = ('ticket_type', 'used', 'club', 'issue_date')
    search_fields = ('buyer_name', 'club__name', 'used_by__name')
    date_hierarchy = 'issue_date'
    raw_id_fields = ('club', 'used_by')
    actions = ['mark_as_used']

    def colored_buyer(self, obj):
        color = 'green' if not obj.used else 'red'
        return format_html('<strong style="color: {};">{}</strong>', color, obj.buyer_name)
    colored_buyer.short_description = 'Buyer'

    def mark_as_used(self, request, queryset):
        count = queryset.update(used=True)
        self.message_user(request, f"{count} ticket(s) marked as used.")
    mark_as_used.short_description = "Mark selected tickets as used"
