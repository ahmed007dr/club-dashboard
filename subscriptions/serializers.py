from rest_framework import serializers
from .models import Subscription, SubscriptionType, FreezeRequest
from core.serializers import ClubSerializer
from members.serializers import MemberSerializer
from accounts.serializers import UserSerializer
from accounts.models import User
from members.models import Member
from django.utils import timezone
from django.db import models
from django.db.models import Q, Count, Sum,F
from django.db.models.functions import TruncMonth
from attendance.models import Attendance


class SubscriptionTypeSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)

    class Meta:
        model = SubscriptionType
        fields = [
            'id', 'club', 'club_details', 'name', 'duration_days', 'price',
            'includes_gym', 'includes_pool', 'includes_classes', 'is_active',
            'max_entries', 'subscriptions_count', 'max_freeze_days', 'is_private_training'
        ]
        extra_kwargs = {
            'club': {'required': True}
        }

    def validate(self, data):
        max_freeze_days = data.get('max_freeze_days', getattr(self.instance, 'max_freeze_days', 0))
        if max_freeze_days < 0:
            raise serializers.ValidationError({
                'max_freeze_days': 'يجب أن تكون أيام التجميد غير سالبة'
            })
        if self.instance and 'is_private_training' in data:
            if not data['is_private_training'] and self.instance.is_private_training:
                if Subscription.objects.filter(
                    type=self.instance,
                    end_date__gte=timezone.now().date()
                ).exists():
                    raise serializers.ValidationError({
                        'is_private_training': 'لا يمكن إلغاء التدريب الخاص لوجود اشتراكات نشطة'
                    })
        return data

class FreezeRequestSerializer(serializers.ModelSerializer):
    created_by_details = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = FreezeRequest
        fields = [
            'id', 'subscription', 'requested_days', 'start_date', 'end_date',
            'is_active', 'cancelled_at', 'created_by', 'created_by_details', 'created_at'
        ]
        extra_kwargs = {
            'is_active': {'read_only': True},
            'cancelled_at': {'read_only': True},
        }



class SubscriptionSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    member_details = MemberSerializer(source='member', read_only=True)
    type_details = SubscriptionTypeSerializer(source='type', read_only=True)
    coach_details = serializers.SerializerMethodField()
    freeze_requests = FreezeRequestSerializer(many=True, read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    subscriptions_count = serializers.SerializerMethodField()
    coach_simple = serializers.SerializerMethodField()
    coach_identifier = serializers.CharField(write_only=True, required=False, allow_blank=True)
    identifier = serializers.CharField(write_only=True, required=False, allow_blank=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            'id', 'club', 'club_details', 'member', 'member_details',
            'type', 'type_details', 'coach', 'coach_details', 'start_date', 'end_date',
            'paid_amount', 'remaining_amount', 'entry_count',
            'created_by', 'created_by_details', 'freeze_requests', 'subscriptions_count',
            'coach_simple', 'coach_identifier', 'identifier', 'status',
            'coach_compensation_type', 'coach_compensation_value'
        ]
        extra_kwargs = {
            'end_date': {'read_only': True},
            'created_by': {'read_only': True},
            'coach': {'required': False},
            'member': {'required': False},
            'remaining_amount': {'required': True},
            'coach_compensation_type': {'required': False},
            'coach_compensation_value': {'required': False},
        }

    def get_status(self, obj):
        today = timezone.now().date()
        max_entries = obj.type.max_entries
        entry_count = obj.entry_count
        active_freeze = obj.freeze_requests.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today
        ).exists()
        if active_freeze:
            return "Frozen"
        is_expired_by_date = obj.end_date < today
        is_expired_by_entries = max_entries > 0 and entry_count >= max_entries
        if is_expired_by_date or is_expired_by_entries:
            return "Expired"
        elif obj.start_date > today:
            return "Upcoming"
        elif obj.start_date <= today <= obj.end_date and obj.type.is_active:
            return "Active"
        return "Unknown"

    def get_subscriptions_count(self, obj):
        return Subscription.objects.filter(member=obj.member).count()

    def get_coach_simple(self, obj):
        if obj.coach:
            return {
                'id': obj.coach.id,
                'username': obj.coach.username
            }
        return None

    def get_coach_details(self, obj):
        if obj.coach and hasattr(obj.coach, 'coach_profile'):
            profile = obj.coach.coach_profile
            return {
                'id': obj.coach.id,
                'username': obj.coach.username,
                'role': obj.coach.role,
                'max_trainees': profile.max_trainees
            }
        return None

    def validate(self, data):
        club = data.get('club')
        subscription_type = data.get('type', getattr(self.instance, 'type', None))
        coach = data.get('coach')
        coach_identifier = data.get('coach_identifier', '')
        member = data.get('member')
        identifier = data.get('identifier', '')
        paid_amount = data.get('paid_amount', getattr(self.instance, 'paid_amount', 0)) or 0
        remaining_amount = data.get('remaining_amount', getattr(self.instance, 'remaining_amount', 0)) or 0
        coach_compensation_type = data.get('coach_compensation_type')
        coach_compensation_value = data.get('coach_compensation_value', getattr(self.instance, 'coach_compensation_value', 0)) or 0

        if remaining_amount < 0:
            raise serializers.ValidationError("المبلغ المتبقي لا يمكن أن يكون سالبًا.")

        if identifier and not member:
            try:
                member = Member.objects.get(
                    Q(phone=identifier) | Q(rfid_code=identifier) | Q(name__iexact=identifier),
                    club=club
                )
                data['member'] = member
            except Member.DoesNotExist:
                raise serializers.ValidationError("لا يوجد عضو بهذا المعرف (هاتف، RFID، أو اسم).")

        if coach_identifier and not coach:
            try:
                coach = User.objects.get(
                    Q(username=coach_identifier) | Q(rfid_code=coach_identifier),
                    role='coach',
                    is_active=True,
                    club=club
                )
                data['coach'] = coach
            except User.DoesNotExist:
                raise serializers.ValidationError("لا يوجد مدرب بهذا المعرف (اسم المستخدم أو RFID).")

        if coach:
            if coach.club != club or coach.role != 'coach' or not coach.is_active:
                raise serializers.ValidationError("الكابتن يجب أن يكون نشطًا ومن نفس النادي.")
            if hasattr(coach, 'coach_profile'):
                profile = coach.coach_profile
                if profile.max_trainees > 0:
                    active_subscriptions = Subscription.objects.filter(
                        coach=coach,
                        club=club,
                        start_date__lte=timezone.now().date(),
                        end_date__gte=timezone.now().date()
                    ).exclude(pk=self.instance.pk if self.instance else None).count()
                    if active_subscriptions >= profile.max_trainees:
                        raise serializers.ValidationError(
                            f"الكابتن {coach.username} وصل للحد الأقصى للعملاء ({profile.max_trainees})."
                        )
            else:
                raise serializers.ValidationError("الكابتن ليس لديه ملف تدريب.")

            if coach_compensation_type not in ['from_subscription', 'external', None]:
                raise serializers.ValidationError("نوع تعويض الكابتن غير صالح.")
            if coach_compensation_value < 0:
                raise serializers.ValidationError("قيمة تعويض الكابتن لا يمكن أن تكون سالبة.")
            if coach_compensation_type == 'from_subscription':
                if coach_compensation_value > 100:
                    raise serializers.ValidationError("نسبة الكابتن لا يمكن أن تتجاوز 100%.")
            if not coach_compensation_type:
                data['coach_compensation_type'] = 'from_subscription'
                data['coach_compensation_value'] = 0
        else:
            if coach_compensation_type or coach_compensation_value > 0:
                raise serializers.ValidationError("لا يمكن تحديد تعويض كابتن بدون اختيار كابتن.")
            data['coach_compensation_type'] = None
            data['coach_compensation_value'] = 0

        if club and subscription_type and subscription_type.club != club:
            raise serializers.ValidationError("نوع الاشتراك يجب أن يكون لنفس النادي.")

        if member:
            today = timezone.now().date()
            active_subscriptions = Subscription.objects.filter(
                member=member,
                club=club,
                start_date__lte=today,
                end_date__gte=today
            ).exclude(entry_count__gte=F('type__max_entries')).exclude(type__max_entries=0)
            if active_subscriptions.exists() and not self.instance:
                latest_active_subscription = active_subscriptions.order_by('-end_date').first()
                if latest_active_subscription:
                    max_end_date = latest_active_subscription.end_date
                    if (latest_active_subscription.entry_count >= latest_active_subscription.type.max_entries and
                            latest_active_subscription.type.max_entries > 0):
                        max_end_date = today
                    start_date = data.get('start_date', today)
                    if start_date <= max_end_date:
                        raise serializers.ValidationError(
                            f"لا يمكن إنشاء اشتراك جديد يبدأ قبل {max_end_date} بسبب وجود اشتراك نشط."
                        )
            unpaid_subscriptions = Subscription.objects.filter(member=member, club=club, remaining_amount__gt=0)
            if unpaid_subscriptions.exists() and not self.instance:
                raise serializers.ValidationError("يجب تسوية المدفوعات المستحقة أولاً.")

        return data

    def create(self, validated_data):
        validated_data.pop('coach_identifier', None)
        validated_data.pop('identifier', None)
        return Subscription.objects.create(**validated_data)

class MemberBehaviorSerializer(serializers.Serializer):
    member_name = serializers.CharField(source='member__name')
    attendance_count = serializers.IntegerField()
    subscription_count = serializers.IntegerField()
    is_regular = serializers.BooleanField()
    is_repeated = serializers.BooleanField()


class CoachReportSerializer(serializers.Serializer):
    coach_id = serializers.IntegerField()
    coach_username = serializers.CharField()
    active_clients = serializers.IntegerField()
    total_coach_compensation = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_paid_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    previous_month_clients = serializers.IntegerField()
    upcoming_subscriptions = serializers.SerializerMethodField()
    expired_subscriptions = serializers.SerializerMethodField()
    monthly_clients = serializers.SerializerMethodField()
    total_career_clients = serializers.SerializerMethodField()
    subscription_types = serializers.SerializerMethodField()
    members_details = serializers.SerializerMethodField()
    revenue_by_type = serializers.SerializerMethodField()
    monthly_revenue = serializers.SerializerMethodField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()

    def get_upcoming_subscriptions(self, obj):
        today = timezone.now().date()
        subscriptions = obj.get('subscriptions', [])
        return [
            {
                'subscription_id': sub.id,
                'member_name': sub.member.name,
                'start_date': sub.start_date,
                'end_date': sub.end_date,
                'type_name': sub.type.name,
                'paid_amount': sub.paid_amount,
                'remaining_amount': sub.remaining_amount,
                'coach_compensation_type': sub.coach_compensation_type,
                'coach_compensation_value': sub.coach_compensation_value,
            }
            for sub in subscriptions if sub.start_date > today
        ]

    def get_expired_subscriptions(self, obj):
        today = timezone.now().date()
        subscriptions = obj.get('subscriptions', [])
        return [
            {
                'subscription_id': sub.id,
                'member_name': sub.member.name,
                'start_date': sub.start_date,
                'end_date': sub.end_date,
                'type_name': sub.type.name,
                'paid_amount': sub.paid_amount,
                'remaining_amount': sub.remaining_amount,
                'coach_compensation_type': sub.coach_compensation_type,
                'coach_compensation_value': sub.coach_compensation_value,
            }
            for sub in subscriptions if sub.end_date < today or (sub.type.max_entries > 0 and sub.entry_count >= sub.type.max_entries)
        ]

    def get_monthly_clients(self, obj):
        start_date = obj.get('start_date')
        end_date = obj.get('end_date')
        monthly_counts = Subscription.objects.filter(
            coach_id=obj['coach_id'],
            club=obj['club'],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).annotate(
            month=TruncMonth('start_date')
        ).values('month').annotate(
            client_count=Count('id')
        ).order_by('month')
        return [
            {
                'month': item['month'].strftime('%Y-%m'),
                'client_count': item['client_count']
            }
            for item in monthly_counts
        ]

    def get_total_career_clients(self, obj):
        return Subscription.objects.filter(
            coach_id=obj['coach_id'],
            club=obj['club']
        ).count()

    def get_subscription_types(self, obj):
        type_counts = Subscription.objects.filter(
            coach_id=obj['coach_id'],
            club=obj['club'],
            start_date__lte=obj['end_date'],
            end_date__gte=obj['start_date']
        ).values('type__name').annotate(
            count=Count('id')
        ).order_by('-count')
        return [
            {
                'type_name': item['type__name'],
                'subscription_count': item['count']
            }
            for item in type_counts
        ]

    def get_revenue_by_type(self, obj):
        revenue_by_type = Subscription.objects.filter(
            coach_id=obj['coach_id'],
            club=obj['club'],
            start_date__lte=obj['end_date'],
            end_date__gte=obj['start_date']
        ).values('type__name').annotate(
            total_paid=Sum('paid_amount'),
            total_remaining=Sum('remaining_amount')
        ).order_by('-total_paid')
        return [
            {
                'type_name': item['type__name'],
                'total_paid': item['total_paid'] or 0.0,
                'total_remaining': item['total_remaining'] or 0.0
            }
            for item in revenue_by_type
        ]

    def get_monthly_revenue(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        monthly_revenue = Subscription.objects.filter(
            coach_id=data['coach_id'],
            club=data['club'],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).annotate(
            month=TruncMonth('start_date')
        ).values('month').annotate(
            total_paid=Sum('paid_amount'),
            total_remaining=Sum('remaining_amount')
        ).order_by('month')
        return [
            {
                'month': item['month'].strftime('%Y-%m'),
                'total_paid': item['total_paid'] or 0.0,
                'total_remaining': item['total_remaining'] or 0.0
            }
            for item in monthly_revenue
        ]

    def get_members_details(self, obj):
        start_date = obj.get('start_date')
        end_date = obj.get('end_date')
        subscriptions = obj.get('subscriptions', [])
        today = timezone.now().date()
        members_data = []
        for sub in subscriptions:
            attendance_count = Attendance.objects.filter(
                subscription=sub,
                attendance_date__range=(start_date, end_date)
            ).count()
            max_entries = sub.type.max_entries
            fully_used = max_entries > 0 and sub.entry_count >= max_entries
            members_data.append({
                'member_id': sub.member.id,
                'member_name': sub.member.name,
                'subscription_id': sub.id,
                'type_name': sub.type.name,
                'start_date': sub.start_date,
                'end_date': sub.end_date,
                'status': 'Active' if sub.start_date <= today <= sub.end_date and not fully_used else 'Expired' if sub.end_date < today or fully_used else 'Upcoming',
                'attendance_count': attendance_count,
                'max_entries': max_entries,
                'entries_used': sub.entry_count,
                'fully_used': fully_used,
                'paid_amount': sub.paid_amount,
                'remaining_amount': sub.remaining_amount,
                'coach_compensation_type': sub.coach_compensation_type,
                'coach_compensation_value': sub.coach_compensation_value,
            })
        return members_data
    
