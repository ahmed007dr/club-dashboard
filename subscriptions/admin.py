from datetime import timedelta

from django.contrib import admin, messages
from django.contrib.admin import AdminSite
from django.core.exceptions import ValidationError
from django.db.models import Q, Sum
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone, html

from .models import SubscriptionType, Subscription, FreezeRequest, CoachProfile
from finance.models import Income, IncomeSource
from core.models import Club
from accounts.models import User
from members.models import Member


@admin.register(SubscriptionType)
class SubscriptionTypeAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'club', 'duration_days', 'price', 'max_freeze_days', 'subscriptions_count',
        'includes_gym', 'includes_pool', 'includes_classes', 'is_active',
    )
    list_filter = ('club', 'is_active', 'includes_gym', 'includes_pool', 'includes_classes')
    search_fields = ('name', 'club__name')
    list_editable = ('is_active', 'max_freeze_days')
    list_select_related = ('club',)
    ordering = ('-id',)
    readonly_fields = ('subscriptions_count',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(club=request.user.club)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'club' and not request.user.is_superuser:
            kwargs['queryset'] = Club.objects.filter(id=request.user.club.id)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if obj.max_freeze_days < 0:
            raise ValidationError("Maximum freeze days cannot be negative.")
        if not change and obj.max_freeze_days == 0:
            messages.warning(request, "Maximum freeze days is set to 0, which disables freezing for this subscription type.")
        super().save_model(request, obj, form, change)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        'member', 'type', 'club', 'start_date', 'end_date', 'paid_amount',
        'remaining_amount', 'entry_count', 'created_by', 'active_freeze_status',
        'total_freeze_days_used',
    )
    list_filter = ('club', 'type', 'start_date', 'end_date')
    search_fields = ('member__name', 'member__phone', 'type__name', 'club__name')
    list_select_related = ('member', 'type', 'club', 'created_by')
    autocomplete_fields = ('member', 'type', 'created_by')
    ordering = ('-start_date',)
    readonly_fields = ('remaining_amount', 'entry_count', 'active_freeze_status', 'total_freeze_days_used')
    date_hierarchy = 'start_date'

    actions = ['renew_subscription']

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(club=request.user.club)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name in ['club', 'type', 'created_by'] and not request.user.is_superuser:
            if db_field.name == 'club':
                kwargs['queryset'] = Club.objects.filter(id=request.user.club.id)
            elif db_field.name == 'type':
                kwargs['queryset'] = SubscriptionType.objects.filter(club=request.user.club)
            elif db_field.name == 'created_by':
                kwargs['queryset'] = User.objects.filter(club=request.user.club)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def active_freeze_status(self, obj):
        active_freeze = obj.freeze_requests.filter(is_active=True, start_date__lte=timezone.now().date()).first()
        if active_freeze:
            return format_html(
                '<span style="color: red;">Active ({} days, until {})</span>',
                active_freeze.requested_days, active_freeze.end_date
            )
        return 'No active freeze'
    active_freeze_status.short_description = 'Freeze Status'

    def total_freeze_days_used(self, obj):
        total = obj.freeze_requests.filter(is_active=False, cancelled_at__isnull=True).aggregate(
            total_days=Sum('requested_days')
        )['total_days'] or 0
        return total
    total_freeze_days_used.short_description = 'Total Freeze Days Used'

    def renew_subscription(self, request, queryset):
        for subscription in queryset:
            subscription.end_date = subscription.end_date + timedelta(days=subscription.type.duration_days)
            subscription.paid_amount = subscription.type.price
            subscription.remaining_amount = 0
            subscription.entry_count = 0
            subscription.save()
            Income.objects.create(
                club=subscription.club,
                source=IncomeSource.objects.get_or_create(name='Renewal')[0],
                amount=subscription.type.price,
                description=f"Renewal for {subscription.member.name}",
                date=timezone.now().date(),
                received_by=request.user
            )
        self.message_user(request, f"{queryset.count()} subscriptions renewed successfully.")
    renew_subscription.short_description = "Renew selected subscriptions"


@admin.register(FreezeRequest)
class FreezeRequestAdmin(admin.ModelAdmin):
    list_display = (
        'subscription', 'requested_days', 'start_date', 'end_date',
        'is_active', 'cancelled_at', 'created_by', 'created_at', 'cancel_link'
    )
    list_filter = ('is_active', 'start_date', 'subscription__club')
    search_fields = (
        'subscription__member__name', 'subscription__type__name',
        'created_by__username', 'subscription__club__name'
    )
    list_select_related = ('subscription__member', 'subscription__type', 'subscription__club', 'created_by')
    autocomplete_fields = ('subscription', 'created_by')
    ordering = ('-created_at',)
    readonly_fields = ('end_date', 'cancelled_at', 'created_at')
    actions = ['cancel_freeze_requests']

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(subscription__club=request.user.club)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name in ['subscription', 'created_by'] and not request.user.is_superuser:
            if db_field.name == 'subscription':
                kwargs['queryset'] = Subscription.objects.filter(club=request.user.club)
            elif db_field.name == 'created_by':
                kwargs['queryset'] = User.objects.filter(club=request.user.club)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def cancel_link(self, obj):
        if obj.is_active:
            url = reverse('admin:cancel_freeze_request', args=[obj.id])
            return format_html('<a href="{}">Cancel Freeze</a>', url)
        return '-'
    cancel_link.short_description = 'Cancel'

    def cancel_freeze_requests(self, request, queryset):
        for freeze_request in queryset.filter(is_active=True):
            today = timezone.now().date()
            used_days = (today - freeze_request.start_date).days
            if used_days < 0:
                used_days = 0
            elif used_days > freeze_request.requested_days:
                used_days = freeze_request.requested_days

            subscription = freeze_request.subscription
            remaining_days = freeze_request.requested_days - used_days
            if remaining_days > 0:
                subscription.end_date -= timedelta(days=remaining_days)
                subscription.save()

            freeze_request.is_active = False
            freeze_request.cancelled_at = timezone.now()
            freeze_request.save()

            messages.info(request, f"Freeze request for {subscription.member.name} cancelled. {remaining_days} days removed from end_date.")

        self.message_user(request, f"{queryset.count()} freeze requests cancelled successfully.")
    cancel_freeze_requests.short_description = "Cancel selected freeze requests"

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:freeze_id>/cancel/',
                self.admin_site.admin_view(self.cancel_freeze_view),
                name='cancel_freeze_request'
            ),
        ]
        return custom_urls + urls

    def cancel_freeze_view(self, request, freeze_id):
        freeze_request = get_object_or_404(FreezeRequest, id=freeze_id, is_active=True)
        today = timezone.now().date()
        used_days = (today - freeze_request.start_date).days
        if used_days < 0:
            used_days = 0
        elif used_days > freeze_request.requested_days:
            used_days = freeze_request.requested_days

        subscription = freeze_request.subscription
        remaining_days = freeze_request.requested_days - used_days
        if remaining_days > 0:
            subscription.end_date -= timedelta(days=remaining_days)
            subscription.save()

        freeze_request.is_active = False
        freeze_request.cancelled_at = timezone.now()
        freeze_request.save()

        messages.info(request, f"Freeze request for {subscription.member.name} cancelled. {remaining_days} days removed from end_date.")
        return HttpResponseRedirect(
            reverse('admin:subscriptions_freezerequest_changelist')
        )


@admin.register(CoachProfile)
class CoachProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'max_trainees', 'user_role', 'user_active')
    list_filter = ('user__role', 'user__is_active')
    search_fields = ('user__username',)
    # readonly_fields = ('user',)

    def user_role(self, obj):
        return obj.user.role
    user_role.short_description = 'دور المستخدم'

    def user_active(self, obj):
        return obj.user.is_active
    user_active.short_description = 'نشط'
    user_active.boolean = True



AdminSite.site_header = "Club Management System"
AdminSite.site_title = "Club Admin"
AdminSite.index_title = "Welcome to Club Management"