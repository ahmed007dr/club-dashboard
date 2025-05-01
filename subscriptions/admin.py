
# subscriptions/admin.py
from django.contrib import admin
from .models import SubscriptionType, Subscription

@admin.register(SubscriptionType)
class SubscriptionTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'duration_days', 'price', 'includes_gym', 'includes_pool', 'is_active')
    list_filter = ('is_active', 'includes_gym', 'includes_pool')
    search_fields = ('name',)

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('member', 'type', 'club', 'start_date', 'end_date', 'paid_amount')
    list_filter = ('club', 'type', 'start_date')
    search_fields = ('member__name',)
    date_hierarchy = 'start_date'
    raw_id_fields = ('member', 'type')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs