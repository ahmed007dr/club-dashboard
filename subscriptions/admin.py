from django.contrib import admin, messages
from django.contrib.admin import AdminSite
from django.core.exceptions import ValidationError
from django.db.models import Q, Sum
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone, html
from datetime import timedelta
from decimal import Decimal

from .models import SubscriptionType, Subscription, FreezeRequest, CoachProfile, Feature, PaymentMethod, Payment
from finance.models import Income, IncomeSource
from core.models import Club
from accounts.models import User
from members.models import Member

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ('name', 'club', 'is_active', 'created_at')
    list_filter = ('club', 'is_active')
    search_fields = ('name', 'club__name')
    list_editable = ('is_active',)
    list_select_related = ('club',)
    ordering = ('-created_at',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(club=request.user.club)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'club' and not request.user.is_superuser:
            kwargs['queryset'] = Club.objects.filter(id=request.user.club.id)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('name', 'club', 'is_active', 'created_at')
    list_filter = ('club', 'is_active')
    search_fields = ('name', 'club__name')
    list_editable = ('is_active',)
    list_select_related = ('club',)
    ordering = ('-created_at',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(club=request.user.club)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'club' and not request.user.is_superuser:
            kwargs['queryset'] = Club.objects.filter(id=request.user.club.id)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('subscription', 'amount', 'payment_method', 'payment_date', 'created_by', 'transaction_id')
    list_filter = ('payment_method', 'payment_date', 'subscription__club')
    search_fields = ('subscription__member__name', 'payment_method__name', 'transaction_id', 'notes')
    list_select_related = ('subscription__member', 'subscription__club', 'payment_method', 'created_by')
    autocomplete_fields = ('subscription', 'payment_method', 'created_by')
    ordering = ('-payment_date',)
    readonly_fields = ('payment_date',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(subscription__club=request.user.club)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name in ['subscription', 'payment_method', 'created_by'] and not request.user.is_superuser:
            if db_field.name == 'subscription':
                kwargs['queryset'] = Subscription.objects.filter(club=request.user.club)
            elif db_field.name == 'payment_method':
                kwargs['queryset'] = PaymentMethod.objects.filter(club=request.user.club, is_active=True)
            elif db_field.name == 'created_by':
                kwargs['queryset'] = User.objects.filter(club=request.user.club)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if obj.amount <= 0:
            raise ValidationError("المبلغ يجب أن يكون موجبًا.")
        total_paid = obj.subscription.payments.aggregate(total=Sum('amount'))['total'] or 0
        if total_paid + obj.amount > obj.subscription.type.price:
            raise ValidationError("إجمالي المدفوعات لا يمكن أن يتجاوز سعر الاشتراك.")
        super().save_model(request, obj, form, change)

@admin.register(SubscriptionType)
class SubscriptionTypeAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'club', 'duration_days', 'price', 'max_freeze_days', 'subscriptions_count',
        'features_list', 'is_active',
    )
    list_filter = ('club', 'is_active', 'features')
    search_fields = ('name', 'club__name')
    list_editable = ('is_active', 'max_freeze_days')
    list_select_related = ('club',)
    filter_horizontal = ('features',)
    ordering = ('-id',)
    readonly_fields = ('subscriptions_count',)

    def features_list(self, obj):
        return ", ".join(f.name for f in obj.features.filter(is_active=True)) or "-"
    features_list.short_description = 'الميزات'

    def get_queryset(self, request):
        qs = super().get_queryset(request).prefetch_related('features')
        if request.user.is_superuser:
            return qs
        return qs.filter(club=request.user.club)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'club' and not request.user.is_superuser:
            kwargs['queryset'] = Club.objects.filter(id=request.user.club.id)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == 'features' and not request.user.is_superuser:
            kwargs['queryset'] = Feature.objects.filter(club=request.user.club, is_active=True)
        return super().formfield_for_manytomany(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if obj.max_freeze_days < 0:
            raise ValidationError("أيام التجميد القصوى لا يمكن أن تكون سالبة.")
        if not change and obj.max_freeze_days == 0:
            messages.warning(request, "أيام التجميد القصوى 0، مما يعطل التجميد لهذا النوع.")
        super().save_model(request, obj, form, change)

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        'member', 'type', 'club', 'start_date', 'end_date', 'paid_amount',
        'remaining_amount', 'entry_count', 'is_cancelled', 'refund_amount',
        'created_by', 'active_freeze_status', 'total_freeze_days_used',
        'payments_list',
    )
    list_filter = ('club', 'type', 'start_date', 'end_date', 'is_cancelled')
    search_fields = ('member__name', 'member__phone', 'type__name', 'club__name')
    list_select_related = ('member', 'type', 'club', 'created_by')
    autocomplete_fields = ('member', 'type', 'created_by')
    ordering = ('-start_date',)
    readonly_fields = (
        'remaining_amount', 'entry_count', 'active_freeze_status', 'total_freeze_days_used',
        'is_cancelled', 'cancellation_date', 'refund_amount', 'payments_list'
    )
    date_hierarchy = 'start_date'
    actions = ['renew_subscription', 'cancel_subscription']

    def payments_list(self, obj):
        payments = obj.payments.all()
        if not payments:
            return "-"
        return html.format_html(
            "<ul>{}</ul>",
            "".join(
                f"<li>{p.amount} {p.payment_method.name} ({p.payment_date.strftime('%Y-%m-%d')})</li>"
                for p in payments
            )
        )
    payments_list.short_description = 'المدفوعات'

    def get_queryset(self, request):
        qs = super().get_queryset(request).prefetch_related('payments__payment_method')
        if request.user.is_superuser:
            return qs
        return qs.filter(club=request.user.club)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name in ['club', 'type', 'created_by'] and not request.user.is_superuser:
            if db_field.name == 'club':
                kwargs['queryset'] = Club.objects.filter(id=request.user.club.id)
            elif db_field.name == 'type':
                kwargs['queryset'] = SubscriptionType.objects.filter(club=request.user.club, is_active=True)
            elif db_field.name == 'created_by':
                kwargs['queryset'] = User.objects.filter(club=request.user.club)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def active_freeze_status(self, obj):
        active_freeze = obj.freeze_requests.filter(is_active=True, start_date__lte=timezone.now().date()).first()
        if active_freeze:
            return format_html(
                '<span style="color: red;">نشط ({} أيام، حتى {})</span>',
                active_freeze.requested_days, active_freeze.end_date
            )
        return 'لا يوجد تجميد نشط'
    active_freeze_status.short_description = 'حالة التجميد'

    def total_freeze_days_used(self, obj):
        total = obj.freeze_requests.filter(is_active=False, cancelled_at__isnull=True).aggregate(
            total_days=Sum('requested_days')
        )['total_days'] or 0
        return total
    total_freeze_days_used.short_description = 'إجمالي أيام التجميد المستخدمة'

    def renew_subscription(self, request, queryset):
        for subscription in queryset:
            if subscription.is_cancelled:
                messages.warning(request, f"لا يمكن تجديد الاشتراك {subscription.member.name} لأنه ملغى.")
                continue
            subscription.end_date = subscription.end_date + timedelta(days=subscription.type.duration_days)
            subscription.paid_amount = 0
            subscription.remaining_amount = subscription.type.price
            subscription.entry_count = 0
            subscription.save()
            messages.info(request, f"تم تجديد اشتراك {subscription.member.name} بنجاح. يرجى إضافة دفعات جديدة.")
        self.message_user(request, f"تم تجديد {queryset.count()} اشتراكات بنجاح.")
    renew_subscription.short_description = "تجديد الاشتراكات المحددة"

    def cancel_subscription(self, request, queryset):
        for subscription in queryset:
            if subscription.is_cancelled:
                messages.warning(request, f"الاشتراك {subscription.member.name} ملغى بالفعل.")
                continue
            refund_amount = subscription.calculate_refunded_amount()
            subscription.is_cancelled = True
            subscription.cancellation_date = timezone.now().date()
            subscription.refund_amount = refund_amount
            subscription.save()
            if refund_amount > 0:
                source, _ = IncomeSource.objects.get_or_create(
                    club=subscription.club, name='Refund', defaults={'description': 'إيراد سالب عن استرداد اشتراك'}
                )
                Income.objects.create(
                    club=subscription.club, source=source, amount=-refund_amount,
                    description=f"استرداد اشتراك {subscription.member.name}",
                    date=timezone.now().date(), received_by=request.user
                )
            messages.info(request, f"تم إلغاء اشتراك {subscription.member.name} مع استرداد {refund_amount}.")
        self.message_user(request, f"تم إلغاء {queryset.count()} اشتراكات بنجاح.")
    cancel_subscription.short_description = "إلغاء الاشتراكات المحددة"

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
            url = reverse('admin:subscriptions_freezerequest_cancel', args=[obj.id])
            return format_html('<a href="{}">إلغاء التجميد</a>', url)
        return '-'
    cancel_link.short_description = 'إلغاء'

    def cancel_freeze_requests(self, request, queryset):
        for freeze_request in queryset.filter(is_active=True):
            today = timezone.now().date()
            used_days = max(0, min((today - freeze_request.start_date).days, freeze_request.requested_days))
            subscription = freeze_request.subscription
            remaining_days = freeze_request.requested_days - used_days
            if remaining_days > 0:
                subscription.end_date -= timedelta(days=remaining_days)
                subscription.save()
            freeze_request.is_active = False
            freeze_request.cancelled_at = timezone.now()
            freeze_request.save()
            messages.info(request, f"تم إلغاء تجميد {subscription.member.name}. تم خصم {remaining_days} أيام من تاريخ الانتهاء.")
        self.message_user(request, f"تم إلغاء {queryset.count()} طلبات تجميد بنجاح.")
    cancel_freeze_requests.short_description = "إلغاء طلبات التجميد المحددة"

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:freeze_id>/cancel/',
                self.admin_site.admin_view(self.cancel_freeze_view),
                name='subscriptions_freezerequest_cancel'
            ),
        ]
        return custom_urls + urls

    def cancel_freeze_view(self, request, freeze_id):
        freeze_request = get_object_or_404(FreezeRequest, id=freeze_id, is_active=True)
        today = timezone.now().date()
        used_days = max(0, min((today - freeze_request.start_date).days, freeze_request.requested_days))
        subscription = freeze_request.subscription
        remaining_days = freeze_request.requested_days - used_days
        if remaining_days > 0:
            subscription.end_date -= timedelta(days=remaining_days)
            subscription.save()
        freeze_request.is_active = False
        freeze_request.cancelled_at = timezone.now()
        freeze_request.save()
        messages.info(request, f"تم إلغاء تجميد {subscription.member.name}. تم خصم {remaining_days} أيام من تاريخ الانتهاء.")
        return HttpResponseRedirect(reverse('admin:subscriptions_freezerequest_changelist'))

@admin.register(CoachProfile)
class CoachProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'max_trainees', 'user_role', 'user_active')
    list_filter = ('user__role', 'user__is_active')
    search_fields = ('user__username',)
    ordering = ('user__username',)

    def user_role(self, obj):
        return obj.user.role
    user_role.short_description = 'دور المستخدم'

    def user_active(self, obj):
        return obj.user.is_active
    user_active.short_description = 'نشط'
    user_active.boolean = True

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user__club=request.user.club)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'user' and not request.user.is_superuser:
            kwargs['queryset'] = User.objects.filter(club=request.user.club, role='coach', is_active=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

AdminSite.site_header = "نظام إدارة النادي"
AdminSite.site_title = "إدارة النادي"
AdminSite.index_title = "مرحبًا بكم في إدارة النادي"