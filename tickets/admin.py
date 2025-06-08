from django.contrib import admin
from .models import Ticket, TicketType

@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'club', 'description')
    list_filter = ('club', 'price')
    search_fields = ('name', 'description')
    ordering = ('name',)
    list_per_page = 20

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(club=request.user.club)

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('serial_number', 'ticket_type', 'price', 'issue_datetime', 'issued_by', 'club', 'notes')
    list_filter = ('club', 'ticket_type', 'issue_datetime')
    search_fields = ('serial_number', 'notes', 'ticket_type__name')
    ordering = ('-issue_datetime',)
    list_per_page = 20
    readonly_fields = ('serial_number', 'price', 'issue_datetime', 'issued_by')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(club=request.user.club)

    def get_readonly_fields(self, request, obj=None):
        if obj:  
            return self.readonly_fields + ('club', 'ticket_type')
        return self.readonly_fields