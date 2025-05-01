
# members/admin.py
from django.contrib import admin
from .models import Member
from subscriptions.models import Subscription

class SubscriptionInline(admin.TabularInline):
    model = Subscription
    extra = 0
    fields = ('type', 'start_date', 'end_date', 'paid_amount')
    readonly_fields = ('start_date', 'end_date')
    raw_id_fields = ('type',)

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'membership_number', 'club', 'phone', 'created_at')
    list_filter = ('club', 'created_at')
    search_fields = ('name', 'membership_number', 'national_id', 'phone')
    date_hierarchy = 'created_at'
    inlines = [SubscriptionInline]
    raw_id_fields = ('referred_by',)
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs