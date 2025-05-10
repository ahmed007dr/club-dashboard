
# invite/admin.py
from django.contrib import admin
from .models import FreeInvite

@admin.register(FreeInvite)
class FreeInviteAdmin(admin.ModelAdmin):
    list_display = ('guest_name', 'club', 'date', 'status', 'invited_by')
    list_filter = ('club', 'status', 'date')
    search_fields = ('guest_name', 'phone')
    date_hierarchy = 'date'
    raw_id_fields = ['invited_by']  
    actions = ['mark_as_used']
    
    def mark_as_used(self, request, queryset):
        queryset.update(status='used')
    mark_as_used.short_description = 'Mark selected invites as used'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs