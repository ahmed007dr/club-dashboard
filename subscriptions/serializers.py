from rest_framework import serializers
from .models import Subscription, SubscriptionType, FreezeRequest
from core.serializers import ClubSerializer
from members.serializers import MemberSerializer
from accounts.serializers import UserSerializer
from django.utils import timezone
from django.db import models


class SubscriptionTypeSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)

    class Meta:
        model = SubscriptionType
        fields = [
            'id', 'club', 'club_details', 'name', 'duration_days', 'price',
            'includes_gym', 'includes_pool', 'includes_classes', 'is_active',
            'max_entries', 'subscriptions_count'
        ]
        extra_kwargs = {
            'club': {'required': True}
        }


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

    class Meta:
        model = Subscription
        fields = [
            'id', 'club', 'club_details', 'member', 'member_details',
            'type', 'type_details', 'coach', 'coach_details', 'start_date', 'end_date',
            'private_training_price', 'paid_amount', 'remaining_amount', 'entry_count',
            'created_by', 'created_by_details', 'freeze_requests', 'subscriptions_count', 'coach_simple'
        ]
        extra_kwargs = {
            'remaining_amount': {'read_only': True},
            'end_date': {'read_only': True},
            'created_by': {'read_only': True},
            'coach': {'required': False},
            'private_training_price': {'required': False},
        }

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
                'max_trainees': profile.max_traines
            }
        return None

    def validate(self, data):
        club = data.get('club')
        subscription_type = data.get('type')
        coach = data.get('coach')
        member = data.get('member')
        private_training_price = data.get('private_training_price', 0)
        start_date = data.get('start_date', timezone.now().date())

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

        elif private_training_price > 0:
            raise serializers.ValidationError("لا يمكن تحديد سعر تدريب خاص لاشتراك غير خاص.")

        if club and subscription_type and subscription_type.club != club:
            raise serializers.ValidationError("نوع الاشتراك يجب أن يكون لنفس النادي.")

        if member:
            today = timezone.now().date()
            active_subscriptions = Subscription.objects.filter(
                member=member,
                club=club,
                start_date__lte=today,
                end_date__gte=today
            ).exclude(entry_count__gte=models.F('type__max_entries')).exclude(type__max_entries=0)

            if active_subscriptions.exists() and not self.instance:
                latest_active_subscription = active_subscriptions.order_by('-end_date').first()
                if latest_active_subscription:
                    max_end_date = latest_active_subscription.end_date
                    if (latest_active_subscription.entry_count >= latest_active_subscription.type.max_entries and
                        latest_active_subscription.type.max_entries > 0):
                        max_end_date = today  
                    if start_date <= max_end_date:
                        raise serializers.ValidationError(
                            f"لا يمكن إنشاء اشتراك جديد يبدأ قبل {max_end_date} بسبب وجود اشتراك نشط."
                        )

            unpaid_subscriptions = Subscription.objects.filter(member=member, club=club, remaining_amount__gt=0)
            if unpaid_subscriptions.exists() and not self.instance:
                raise serializers.ValidationError("يجب تسوية المدفوعات المستحقة أولاً.")

        return data

class CoachReportSerializer(serializers.Serializer):
    coach_id = serializers.IntegerField()
    coach_username = serializers.CharField()
    active_clients = serializers.IntegerField()
    total_private_training_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_paid_amount = serializers.DecimalField(max_digits=10, decimal_places=2)