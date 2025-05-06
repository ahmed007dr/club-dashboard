from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from .models import Receipt, AutoCorrectionLog
from django.utils.html import format_html


# Resource for Receipt
class ReceiptResource(resources.ModelResource):
    class Meta:
        model = Receipt
        fields = (
            'id', 'club__name', 'member__name', 'subscription__id', 'date',
            'amount', 'payment_method', 'note', 'issued_by__username', 'invoice_number'
        )
        export_order = fields


@admin.register(Receipt)
class ReceiptAdmin(ImportExportModelAdmin):
    resource_class = ReceiptResource
    list_display = (
        'id', 'colored_member', 'amount', 'payment_method', 'club', 'date', 'issued_by', 'invoice_number'
    )
    list_filter = ('payment_method', 'club', 'date')
    search_fields = ('member__name', 'invoice_number', 'amount', 'issued_by__username')
    raw_id_fields = ('member', 'subscription', 'club', 'issued_by')
    date_hierarchy = 'date'

    def colored_member(self, obj):
        return format_html(f'<strong style="color:green;">{obj.member.name}</strong>')
    colored_member.short_description = 'Member'


# Resource for AutoCorrectionLog
class CorrectionLogResource(resources.ModelResource):
    class Meta:
        model = AutoCorrectionLog
        fields = (
            'id', 'member__name', 'old_subscription__id', 'new_subscription__id',
            'created_at', 'note'
        )
        export_order = fields


@admin.register(AutoCorrectionLog)
class AutoCorrectionLogAdmin(ImportExportModelAdmin):
    resource_class = CorrectionLogResource
    list_display = ('member', 'old_subscription', 'new_subscription', 'created_at', 'note')
    search_fields = ('member__name',)
    raw_id_fields = ('member', 'old_subscription', 'new_subscription')
    date_hierarchy = 'created_at'
