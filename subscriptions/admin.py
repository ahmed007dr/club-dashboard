from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from .models import Subscription, SubscriptionType
from datetime import date, timedelta
from django.utils.html import format_html


# ========== Resource Classes ==========
class SubscriptionTypeResource(resources.ModelResource):
    class Meta:
        model = SubscriptionType
        fields = (
            'id', 'club__name', 'name', 'duration_days', 'price',
            'includes_gym', 'includes_pool', 'includes_classes',
            'is_active', 'max_entries'
        )


class SubscriptionResource(resources.ModelResource):
    class Meta:
        model = Subscription
        fields = (
            'id', 'club__name', 'member__name', 'type__name', 'start_date', 'end_date',
            'paid_amount', 'remaining_amount', 'entry_count'
        )


# ========== Admin for SubscriptionType ==========
@admin.register(SubscriptionType)
class SubscriptionTypeAdmin(ImportExportModelAdmin):
    resource_class = SubscriptionTypeResource
    list_display = ('name', 'club', 'duration_days', 'price', 'max_entries', 'is_active')
    list_filter = ('club', 'is_active')
    search_fields = ('name', 'club__name')


# ========== Admin for Subscription ==========
@admin.register(Subscription)
class SubscriptionAdmin(ImportExportModelAdmin):
    resource_class = SubscriptionResource
    list_display = (
        'colored_member', 'type', 'club', 'start_date', 'end_date',
        'paid_amount', 'remaining_amount', 'entry_count', 'remaining_entries', 'days_remaining'
    )
    list_filter = ('club', 'type', 'start_date', 'end_date')
    search_fields = ('member__name', 'type__name', 'club__name')
    date_hierarchy = 'start_date'
    raw_id_fields = ('member', 'club', 'type')
    actions = ['renew_subscription']

    # تلوين الصفوف
    def colored_member(self, obj):
        color = ''
        today = date.today()

        if obj.end_date:
            if obj.end_date < today:
                color = 'red'
            elif obj.end_date <= today + timedelta(days=3):
                color = 'orange'
            else:
                color = 'green'

        return format_html('<span style="color: {};">{}</span>', color, obj.member.name)
    colored_member.short_description = 'Member'

    def days_remaining(self, obj):
        if obj.end_date:
            remaining = (obj.end_date - date.today()).days
            return max(0, remaining)
        return "-"
    days_remaining.short_description = 'Days Remaining'

    def remaining_entries(self, obj):
        if obj.type.max_entries == 0:
            return "Unlimited"
        return max(0, obj.type.max_entries - obj.entry_count)
    remaining_entries.short_description = 'Remaining Entries'

    # Action لتجديد الاشتراك
    def renew_subscription(self, request, queryset):
        renewed = 0
        for sub in queryset:
            if sub.end_date:
                sub.start_date = sub.end_date + timedelta(days=1)
                sub.end_date = sub.start_date + timedelta(days=sub.type.duration_days)
                sub.entry_count = 0
                sub.save()
                renewed += 1
        self.message_user(request, f"{renewed} subscription(s) renewed successfully.")
    renew_subscription.short_description = "Renew selected subscriptions"