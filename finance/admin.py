from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from django.utils.html import format_html
from .models import Expense, ExpenseCategory, Income, IncomeSource, StockItem, StockTransaction,Schedule


# Resources for Import/Export
class ExpenseCategoryResource(resources.ModelResource):
    class Meta:
        model = ExpenseCategory
        fields = ('id', 'club__name', 'name', 'description', 'is_stock_related')


class ExpenseResource(resources.ModelResource):
    class Meta:
        model = Expense
        fields = (
            'id', 'club__name', 'category__name', 'amount', 'description',
            'date', 'paid_by__username', 'invoice_number', 'stock_item__name', 'stock_quantity'
        )


class IncomeSourceResource(resources.ModelResource):
    class Meta:
        model = IncomeSource
        fields = ('id', 'club__name', 'name', 'description', 'price', 'stock_item__name')


class IncomeResource(resources.ModelResource):
    class Meta:
        model = Income
        fields = (
            'id', 'club__name', 'source__name', 'amount', 'description',
            'date', 'received_by__username', 'related_receipt__id', 'stock_transaction__id'
        )


class StockItemResource(resources.ModelResource):
    class Meta:
        model = StockItem
        fields = (
            'id', 'club__name', 'name', 'description', 'unit',
            'initial_quantity', 'current_quantity', 'is_sellable'
        )


class StockTransactionResource(resources.ModelResource):
    class Meta:
        model = StockTransaction
        fields = (
            'id', 'stock_item__name', 'transaction_type', 'quantity',
            'date', 'description', 'related_expense__id', 'related_income__id'
        )


# Admin Classes
@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'club', 'description', 'is_stock_related')
    search_fields = ('name', 'description')
    list_filter = ('club', 'is_stock_related')
    fields = ('club', 'name', 'description', 'is_stock_related')


@admin.register(Expense)
class ExpenseAdmin(ImportExportModelAdmin):
    resource_class = ExpenseResource
    list_display = (
        'club', 'category', 'amount', 'date', 'paid_by', 'invoice_number',
        'stock_item', 'stock_quantity', 'view_attachment'
    )
    search_fields = ('category__name', 'invoice_number', 'description', 'stock_item__name')
    list_filter = ('club', 'category', 'date', 'category__is_stock_related')
    date_hierarchy = 'date'
    raw_id_fields = ('club', 'category', 'paid_by', 'stock_item')
    list_select_related = ('club', 'category', 'paid_by', 'stock_item')

    def view_attachment(self, obj):
        if obj.attachment:
            return format_html(f'<a href="{obj.attachment.url}" target="_blank">📎 View</a>')
        return "-"
    view_attachment.short_description = "Attachment"


@admin.register(IncomeSource)
class IncomeSourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'club', 'price', 'stock_item', 'is_sellable', 'description')
    search_fields = ('name', 'description', 'stock_item__name')
    list_filter = ('club', 'stock_item__is_sellable')
    raw_id_fields = ('club', 'stock_item')
    list_select_related = ('club', 'stock_item')

    def is_sellable(self, obj):
        return obj.stock_item.is_sellable if obj.stock_item else "-"
    is_sellable.short_description = "قابل للبيع"


@admin.register(Income)
class IncomeAdmin(ImportExportModelAdmin):
    resource_class = IncomeResource
    list_display = (
        'club', 'source', 'amount', 'date', 'received_by',
        'stock_transaction_link', 'related_receipt_link'
    )
    search_fields = ('source__name', 'description', 'stock_transaction__id')
    list_filter = ('club', 'source', 'date', 'source__stock_item__is_sellable')
    date_hierarchy = 'date'
    raw_id_fields = ('club', 'source', 'received_by', 'related_receipt', 'stock_transaction')
    list_select_related = ('club', 'source', 'received_by', 'related_receipt', 'stock_transaction')

    def stock_transaction_link(self, obj):
        if obj.stock_transaction:
            return format_html(f'<a href="/admin/finance/stocktransaction/{obj.stock_transaction.id}/change/">#{obj.stock_transaction.id}</a>')
        return "-"
    stock_transaction_link.short_description = "حركة المخزون"

    def related_receipt_link(self, obj):
        if obj.related_receipt:
            return format_html(f'<a href="/admin/receipts/receipt/{obj.related_receipt.id}/change/">#{obj.related_receipt.id}</a>')
        return "-"
    related_receipt_link.short_description = "إيصال"


@admin.register(StockItem)
class StockItemAdmin(ImportExportModelAdmin):
    resource_class = StockItemResource
    list_display = (
        'name', 'club', 'unit', 'initial_quantity', 'current_quantity',
        'is_sellable', 'description'
    )
    search_fields = ('name', 'description')
    list_filter = ('club', 'is_sellable', 'unit')
    fields = (
        'club', 'name', 'description', 'unit',
        'initial_quantity', 'current_quantity', 'is_sellable'
    )
    raw_id_fields = ('club',)
    list_select_related = ('club',)


@admin.register(StockTransaction)
class StockTransactionAdmin(ImportExportModelAdmin):
    resource_class = StockTransactionResource
    list_display = (
        'stock_item', 'transaction_type', 'quantity', 'date',
        'related_expense_link', 'related_income_link', 'description'
    )
    search_fields = ('stock_item__name', 'description')
    list_filter = ('stock_item__club', 'transaction_type', 'stock_item__is_sellable', 'date')
    date_hierarchy = 'date'
    raw_id_fields = ('stock_item', 'related_expense', 'related_income')
    list_select_related = ('stock_item', 'related_expense', 'related_income')

    def related_expense_link(self, obj):
        if obj.related_expense:
            return format_html(f'<a href="/admin/finance/expense/{obj.related_expense.id}/change/">#{obj.related_expense.id}</a>')
        return "-"
    related_expense_link.short_description = "مصروف مرتبط"

    def related_income_link(self, obj):
        if obj.related_income:
            return format_html(f'<a href="/admin/finance/income/{obj.related_income.id}/change/">#{obj.related_income.id}</a>')
        return "-"
    related_income_link.short_description = "إيراد مرتبط"

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('title', 'club', 'type', 'start', 'end', 'created_by')
    search_fields = ('title', 'type')
    list_filter = ('club', 'type', 'start')
    date_hierarchy = 'start'
    raw_id_fields = ('club', 'created_by')
    list_select_related = ('club', 'created_by')
    