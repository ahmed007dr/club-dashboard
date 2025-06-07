from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from .models import Expense, ExpenseCategory, Income, IncomeSource
from django.utils.html import format_html


# Resources
class ExpenseResource(resources.ModelResource):
    class Meta:
        model = Expense
        fields = (
            'id', 'club__name', 'category__name', 'amount', 'description',
            'date', 'paid_by__username', 'invoice_number'
        )


class IncomeResource(resources.ModelResource):
    class Meta:
        model = Income
        fields = (
            'id', 'club__name', 'source__name', 'amount', 'description',
            'date', 'received_by__username', 'related_receipt__id'
        )


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'club', 'description')
    search_fields = ('name',)
    list_filter = ('club',)


@admin.register(Expense)
class ExpenseAdmin(ImportExportModelAdmin):
    resource_class = ExpenseResource
    list_display = (
        'club', 'category', 'amount', 'date', 'paid_by', 'invoice_number', 'view_attachment'
    )
    search_fields = ('category__name', 'invoice_number', 'description')
    list_filter = ('club', 'category', 'date')
    date_hierarchy = 'date'
    raw_id_fields = ('club', 'category', 'paid_by')

    def view_attachment(self, obj):
        if obj.attachment:
            return format_html(f'<a href="{obj.attachment.url}" target="_blank">📎 View</a>')
        return "-"
    view_attachment.short_description = "Attachment"


@admin.register(IncomeSource)
class IncomeSourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'description','club')
    search_fields = ('name',)
    list_filter = ('club',)


@admin.register(Income)
class IncomeAdmin(ImportExportModelAdmin):
    resource_class = IncomeResource
    list_display = (
        'club', 'source', 'amount', 'date', 'received_by', 'related_receipt_link'
    )
    search_fields = ('source__name', 'description')
    list_filter = ('club', 'source', 'date')
    date_hierarchy = 'date'
    raw_id_fields = ('club', 'source', 'received_by', 'related_receipt')

    def related_receipt_link(self, obj):
        if obj.related_receipt:
            return format_html(f'<a href="/admin/receipts/receipt/{obj.related_receipt.id}/change/">#{obj.related_receipt.id}</a>')
        return "-"
    related_receipt_link.short_description = "Receipt"
