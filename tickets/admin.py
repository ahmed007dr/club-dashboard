from django.contrib import admin
from .models import Ticket, TicketType, TicketBook

@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'club', 'price', 'description')
    list_filter = ('club',)
    search_fields = ('name', 'description')
    ordering = ('name',)
    list_per_page = 20

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            return qs.filter(club=request.user.club)
        return qs

@admin.register(TicketBook)
class TicketBookAdmin(admin.ModelAdmin):
    list_display = ('serial_prefix', 'club', 'issued_date', 'issued_tickets', 'total_tickets')
    list_filter = ('club', 'issued_date')
    search_fields = ('serial_prefix',)
    ordering = ('-issued_date',)
    list_per_page = 20

    def issued_tickets(self, obj):
        return Ticket.objects.filter(book=obj).count()
    issued_tickets.short_description = 'التذاكر المصدرة'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            return qs.filter(club=request.user.club)
        return qs

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('serial_number', 'ticket_type', 'notes', 'price', 'issue_datetime', 'issued_by', 'book')
    list_filter = ('club', 'ticket_type', 'issue_datetime')
    search_fields = ('serial_number', 'notes')
    ordering = ('-issue_datetime',)
    list_per_page = 20
    readonly_fields = ('issue_datetime', 'price', 'serial_number', 'issued_by')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            return qs.filter(club=request.user.club)
        return qs

    def save_model(self, request, obj, form, change):
        if not change and not obj.issued_by:
            obj.issued_by = request.user
        super().save_model(request, obj, form, change)