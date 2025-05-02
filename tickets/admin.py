
# tickets/admin.py
from django.contrib import admin
from .models import Ticket

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('buyer_name', 'club', 'ticket_type', 'price', 'used', 'issue_date')
    list_filter = ('club', 'ticket_type', 'used', 'issue_date')
    search_fields = ('buyer_name',)
    date_hierarchy = 'issue_date'
    raw_id_fields = ('used_by',)
    actions = ['mark_as_used']
    
    def mark_as_used(self, request, queryset):
        queryset.update(used=True)
    mark_as_used.short_description = 'Mark selected tickets as used'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs