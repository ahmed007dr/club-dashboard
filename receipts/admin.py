
# receipts/admin.py
from django.contrib import admin
from .models import Receipt, AutoCorrectionLog

@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'member', 'club', 'amount', 'date', 'payment_method')
    list_filter = ('club', 'payment_method', 'date')
    search_fields = ('invoice_number', 'member__name')
    date_hierarchy = 'date'
    raw_id_fields = ('member', 'subscription', 'issued_by')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs

@admin.register(AutoCorrectionLog)
class AutoCorrectionLogAdmin(admin.ModelAdmin):
    list_display = ('member', 'old_subscription', 'new_subscription', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('member__name', 'note')
    date_hierarchy = 'created_at'
    raw_id_fields = ('member', 'old_subscription', 'new_subscription')
    readonly_fields = ('created_at',)
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(member__club=request.user.club)
        return qs