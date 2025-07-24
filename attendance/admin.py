from django.contrib import admin
from django.http import HttpResponse
from django.utils import timezone
from .models import Attendance, EntryLog
from subscriptions.models import Subscription
import csv
import io
from datetime import datetime

class AttendanceInline(admin.TabularInline):
    model = Attendance
    extra = 0
    fields = ('timestamp', 'subscription', 'member_name', 'subscription_type')
    readonly_fields = ('timestamp', 'member_name', 'subscription_type')

    def member_name(self, obj):
        return obj.subscription.member.name
    member_name.short_description = 'اسم العضو'

    def subscription_type(self, obj):
        return obj.subscription.type.name
    subscription_type.short_description = 'نوع الاشتراك'

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = (
        'subscription',
        'member_name',
        'subscription_type',
        'club_name',
        'timestamp',
        'approved_by',
    )
    list_filter = (
        'timestamp',
        'subscription__club',
        'subscription__type__name',
        'subscription__coach',
        'approved_by',
    )
    search_fields = (
        'subscription__member__name',
        'subscription__member__rfid_code',
        'subscription__member__phone',
        'subscription__type__name',
    )
    date_hierarchy = 'timestamp'
    raw_id_fields = ('subscription', 'approved_by')
    list_select_related = (
        'subscription__member',
        'subscription__type',
        'subscription__club',
        'approved_by',
    )
    actions = ['recalculate_entry_count', 'export_attendances']

    def member_name(self, obj):
        return obj.subscription.member.name
    member_name.short_description = 'اسم العضو'

    def subscription_type(self, obj):
        return obj.subscription.type.name
    subscription_type.short_description = 'نوع الاشتراك'

    def club_name(self, obj):
        return obj.subscription.club.name
    club_name.short_description = 'النادي'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(subscription__club=request.user.club)
        return qs

    def recalculate_entry_count(self, request, queryset):
        """إعادة احتساب عدد الدخول (entry_count) للاشتراكات المرتبطة."""
        for attendance in queryset:
            subscription = attendance.subscription
            entry_count = Attendance.objects.filter(subscription=subscription).count()
            subscription.entry_count = entry_count
            subscription.save()
        self.message_user(request, f"تم إعادة احتساب عدد الدخول لـ {queryset.count()} سجل حضور.")
    recalculate_entry_count.short_description = "إعادة احتساب عدد الدخول"

    def export_attendances(self, request, queryset):
        """تصدير سجلات الحضور كملف CSV."""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="attendances_{}.csv"'.format(
            datetime.now().strftime('%Y%m%d_%H%M%S')
        )
        response.write('\ufeff'.encode('utf8'))  # BOM for Excel compatibility

        writer = csv.writer(response)
        writer.writerow([
            'معرف السجل',
            'اسم العضو',
            'كود RFID',
            'رقم الهاتف',
            'نوع الاشتراك',
            'النادي',
            'التاريخ والوقت',
            'الموافق عليه',
            'المدرب'
        ])

        for attendance in queryset:
            writer.writerow([
                attendance.id,
                attendance.subscription.member.name,
                attendance.subscription.member.rfid_code or '',
                attendance.subscription.member.phone or '',
                attendance.subscription.type.name,
                attendance.subscription.club.name,
                attendance.timestamp.astimezone(timezone.get_current_timezone()).strftime('%Y-%m-%d %H:%M:%S'),
                attendance.approved_by.username if attendance.approved_by else '',
                attendance.subscription.coach.username if attendance.subscription.coach else ''
            ])

        return response
    export_attendances.short_description = "تصدير سجلات الحضور كـ CSV"

@admin.register(EntryLog)
class EntryLogAdmin(admin.ModelAdmin):
    list_display = (
        'member',
        'club',
        'related_subscription_type',
        'timestamp',
        'approved_by',
    )
    list_filter = (
        'club',
        'timestamp',
        'related_subscription__type__name',
        'approved_by',
    )
    search_fields = (
        'member__name',
        'member__rfid_code',
        'member__phone',
        'club__name',
        'related_subscription__type__name',
    )
    date_hierarchy = 'timestamp'
    raw_id_fields = ('member', 'approved_by', 'related_subscription')
    list_select_related = (
        'member',
        'club',
        'related_subscription__type',
        'approved_by',
    )

    def related_subscription_type(self, obj):
        return obj.related_subscription.type.name if obj.related_subscription else 'غير محدد'
    related_subscription_type.short_description = 'نوع الاشتراك'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role != 'owner':
            return qs.filter(club=request.user.club)
        return qs
