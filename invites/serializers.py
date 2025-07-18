# invites/serializers.py
from rest_framework import serializers
from .models import FreeInvite
from core.serializers import ClubSerializer
from accounts.serializers import UserSerializer
from members.serializers import MemberSerializer
from members.models import Member
from subscriptions.models import Subscription
from django.utils import timezone

class MemberByMembershipNumberField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        try:
            return Member.objects.get(membership_number=data)
        except Member.DoesNotExist:
            return None

    def to_representation(self, value):
        if isinstance(value, Member):
            return value.membership_number
        try:
            return Member.objects.get(pk=value.pk).membership_number
        except (Member.DoesNotExist, AttributeError):
            return None

class FreeInviteSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    invited_by = MemberByMembershipNumberField(
        queryset=Member.objects.all(), required=False, allow_null=True
    )
    invited_by_details = MemberSerializer(source='invited_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    subscription = serializers.PrimaryKeyRelatedField(
        queryset=Subscription.objects.all(), required=True
    )
    subscription_details = serializers.SerializerMethodField()

    class Meta:
        model = FreeInvite
        fields = [
            'id',
            'club',
            'club_details',
            'guest_name',
            'phone',
            'date',
            'status',
            'status_display',
            'invited_by',
            'invited_by_details',
            'subscription',
            'subscription_details',
        ]

    def get_subscription_details(self, obj):
        if obj.subscription:
            return {
                'id': obj.subscription.id,
                'type_name': obj.subscription.type.name,
                'free_invites_allowed': obj.subscription.type.free_invites_allowed,
                'start_date': obj.subscription.start_date,
                'end_date': obj.subscription.end_date,
            }
        return None

    def validate(self, data):
        invited_by = data.get('invited_by')
        subscription = data.get('subscription')
        today = timezone.now().date()

        if invited_by and subscription:
            if subscription.member != invited_by:
                raise serializers.ValidationError("الاشتراك غير مرتبط بالعضو المدعو.")
            
            if subscription.is_cancelled or subscription.end_date < today or subscription.start_date > today:
                raise serializers.ValidationError("الاشتراك غير نشط أو منتهي.")
            
            used_invites = FreeInvite.objects.filter(
                subscription=subscription,
                status__in=['pending', 'used']
            ).count()
            if used_invites >= subscription.type.free_invites_allowed:
                raise serializers.ValidationError("تم استنفاد عدد الدعوات المجانية لهذا الاشتراك.")
            
            if subscription.club != data.get('club'):
                raise serializers.ValidationError("الاشتراك يجب أن يكون لنفس النادي.")

        return data