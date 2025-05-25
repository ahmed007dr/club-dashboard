from rest_framework import serializers
from .models import Subscription, SubscriptionType
from core.serializers import ClubSerializer
from utils.permissions import IsOwnerOrRelatedToClub
from members.serializers import MemberSerializer
from django.utils import timezone
from django.db import models

class SubscriptionTypeSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)

    class Meta:
        model = SubscriptionType
        fields = [
            'id', 'club', 'club_details', 'name', 'duration_days', 'price',
            'includes_gym', 'includes_pool', 'includes_classes', 'is_active',
            'max_entries', 'is_private', 'private_fee'
        ]
        extra_kwargs = {
            'club': {'required': True}
        }

class SubscriptionSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    member_details = MemberSerializer(source='member', read_only=True)
    type_details = SubscriptionTypeSerializer(source='type', read_only=True)
    subscription_type = serializers.CharField(source='type.name', read_only=True)
    is_private = serializers.BooleanField(source='type.is_private', read_only=True)
    coach_name = serializers.CharField(source='coach.username', read_only=True, allow_null=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'club', 'club_details', 'member', 'member_details',
            'type', 'type_details', 'subscription_type', 'is_private', 'coach', 'coach_name',
            'start_date', 'end_date', 'paid_amount', 'remaining_amount', 'entry_count'
        ]
        extra_kwargs = {
            'remaining_amount': {'read_only': True},
            'end_date': {'read_only': True},
        }

    def validate(self, data):
        club = data.get('club')
        subscription_type = data.get('type')
        start_date = data.get('start_date')
        member = data.get('member')

        # Validate club and subscription type consistency
        if club and subscription_type and subscription_type.club != club:
            raise serializers.ValidationError("The subscription type must belong to the same club as the subscription.")

        # Validate coach for private subscriptions
        if subscription_type and subscription_type.is_private:
            coach = data.get('coach')
            if not coach:
                raise serializers.ValidationError("A coach is required for private subscriptions.")
            if coach.club != club:
                raise serializers.ValidationError("The coach must belong to the same club as the subscription.")

        if member:
            today = timezone.now().date()
            active_subscriptions = Subscription.objects.filter(
                member=member,
                club=club,
                start_date__lte=today,
                end_date__gte=today
            ).exclude(
                entry_count__gte=models.F('type__max_entries')
            ).exclude(
                type__max_entries=0
            )

            if active_subscriptions.exists() and not self.instance:
                raise serializers.ValidationError(
                    "هذا العضو لديه اشتراك نشط بالفعل. يرجى الانتظار حتى ينتهي أو تنفد الإدخالات."
                )

            unpaid_subscriptions = Subscription.objects.filter(
                member=member,
                club=club,
                remaining_amount__gt=0
            )

            if unpaid_subscriptions.exists() and not self.instance:
                raise serializers.ValidationError(
                    "هذا العضو لديه مبالغ غير مدفوعة لاشتراكات سابقة. يرجى تسوية جميع المدفوعات المستحقة قبل إنشاء اشتراك جديد."
                )

        return data