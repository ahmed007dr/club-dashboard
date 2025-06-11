from rest_framework import serializers
from .models import Subscription, SubscriptionType, FreezeRequest
from core.serializers import ClubSerializer
from members.serializers import MemberSerializer
from accounts.serializers import UserSerializer
from accounts.models import User
from members.models import Member
from django.utils import timezone
from django.db import models
from django.db.models import Q


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
        # Ensure max_freeze_days is non-negative
        max_freeze_days = data.get('max_freeze_days', getattr(self.instance, 'max_freeze_days', 0))
        if max_freeze_days < 0:
            raise serializers.ValidationError({
                'max_freeze_days': 'يجب أن تكون أيام التجميد غير سالبة'
            })

        # Prevent disabling is_private_training if active subscriptions exist
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
            'private_training_price', 'paid_amount', 'remaining_amount', 'entry_count',
            'created_by', 'created_by_details', 'freeze_requests', 'subscriptions_count',
            'coach_simple', 'coach_identifier', 'identifier', 'status'
        ]
        extra_kwargs = {
            'remaining_amount': {'read_only': True},
            'end_date': {'read_only': True},
            'created_by': {'read_only': True},
            'coach': {'required': False},
            'private_training_price': {'required': False},
            'member': {'required': False}
        }

    def get_status(self, obj):
        today = timezone.now().date()
        max_entries = obj.type.max_entries
        entry_count = obj.entry_count

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
        private_training_price = data.get('private_training_price', getattr(self.instance, 'private_training_price', 0))

        # Handle identifier if provided
        if identifier and not member:
            try:
                member = Member.objects.get(
                    Q(phone=identifier) | Q(rfid_code=identifier) | Q(name__iexact=identifier),
                    club=club
                )
                data['member'] = member
            except Member.DoesNotExist:
                raise serializers.ValidationError("لا يوجد عضو بهذا المعرف (هاتف، RFID، أو اسم).")

        # Handle coach_identifier if provided
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

        # Handle private training logic
        if subscription_type and subscription_type.is_private_training:
            if not coach:
                raise serializers.ValidationError("مطلوب كابتن لاشتراك التدريب الخاص.")
            if coach and (coach.club != club or coach.role != 'coach' or not coach.is_active):
                raise serializers.ValidationError("الكابتن يجب أن يكون نشط ومن نفس النادي.")
            if private_training_price <= 0:
                raise serializers.ValidationError("سعر التدريب الخاص يجب أن يكون أكبر من 0.")

            if coach and hasattr(coach, 'coach_profile'):
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
        else:
            # If not private training, ensure private_training_price and coach are null
            if private_training_price is not None and private_training_price > 0:
                raise serializers.ValidationError("لا يمكن تحديد سعر تدريب خاص لاشتراك غير خاص.")
            if coach is not None:
                data['coach'] = None
            if private_training_price is not None:
                data['private_training_price'] = None

        if club and subscription_type and subscription_type.club != club:
            raise serializers.ValidationError("نوع الاشتراك يجب أن يكون لنفس النادي.")

        if member:
            today = timezone.now().date()
            active_subscriptions = Subscription.objects.filter(
                member=member, club=club, start_date__lte=today, end_date__gte=today
            ).exclude(entry_count__gte=models.F('type__max_entries')).exclude(type__max_entries=0)

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
        # Remove coach_identifier and identifier from validated_data
        validated_data.pop('coach_identifier', None)
        validated_data.pop('identifier', None)
        # Create the subscription
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
    total_private_training_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_paid_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    previous_month_clients = serializers.IntegerField()
    subscriptions = serializers.SerializerMethodField()
    completed_subscriptions = serializers.SerializerMethodField()

    def get_subscriptions(self, obj):
        today = timezone.now().date()
        subscriptions = obj.get('subscriptions', [])
        return [
            {
                'subscription_id': sub.id,
                'member_name': sub.member.name,
                'start_date': sub.start_date,
                'end_date': sub.end_date,
                'status': 'سارية' if sub.start_date <= today <= sub.end_date else 'منتهية',
                'private_training_price': sub.private_training_price,
                'paid_amount': sub.paid_amount,
            }
            for sub in subscriptions
        ]

    def get_completed_subscriptions(self, obj):
        start_date = obj.get('start_date')
        end_date = obj.get('end_date')
        subscriptions = obj.get('subscriptions', [])
        return [
            {
                'subscription_id': sub.id,
                'member_name': sub.member.name,
                'start_date': sub.start_date,
                'end_date': sub.end_date,
                'private_training_price': sub.private_training_price,
                'paid_amount': sub.paid_amount,
            }
            for sub in subscriptions
            if start_date <= sub.end_date <= end_date
        ]