
# finance/admin.py
from django.contrib import admin
from .models import ExpenseCategory, Expense, IncomeSource, Income

@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'club', 'description')
    search_fields = ('name', 'description')
    list_filter = ('club',)
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('category', 'amount', 'club', 'date', 'paid_by')
    list_filter = ('club', 'category', 'date')
    search_fields = ('description', 'invoice_number')
    date_hierarchy = 'date'
    raw_id_fields = ('paid_by',)
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs

@admin.register(IncomeSource)
class IncomeSourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'club', 'description')
    search_fields = ('name', 'description')
    list_filter = ('club',)
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs

@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ('source', 'amount', 'club', 'date', 'received_by')
    list_filter = ('club', 'source', 'date')
    search_fields = ('description',)
    date_hierarchy = 'date'
    raw_id_fields = ('received_by', 'related_receipt')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs
