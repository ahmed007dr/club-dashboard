
# staff/admin.py
from django.contrib import admin
from .models import Shift

@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('staff','club', 'date', 'shift_start', 'shift_end', 'approved_by')
    list_filter = ('club', 'date')
    search_fields = ('staff__username',)
    date_hierarchy = 'date'
    raw_id_fields = ('staff', 'approved_by')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs
