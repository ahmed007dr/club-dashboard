from rest_framework import serializers
from .models import Attendance, EntryLog
from members.serializers import MemberSerializer
from subscriptions.serializers import SubscriptionSerializer
from core.serializers import ClubSerializer, UserSerializer

class AttendanceSerializer(serializers.ModelSerializer):
    member_details = serializers.SerializerMethodField()
    subscription_details = SubscriptionSerializer(source='subscription', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id',
            'subscription',
            'subscription_details',
            'attendance_date',
            'member_details'
        ]

    def get_member_details(self, obj):
        return {
            'id': obj.subscription.member.id,
            'name': obj.subscription.member.name,
            'membership_number': obj.subscription.member.membership_number
        }

class EntryLogSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    member_details = MemberSerializer(source='member', read_only=True)
    approved_by_details = UserSerializer(source='approved_by', read_only=True)
    subscription_details = SubscriptionSerializer(source='related_subscription', read_only=True)

    class Meta:
        model = EntryLog
        fields = [
            'id',
            'club',
            'club_details',
            'member',
            'member_details',
            'timestamp',
            'approved_by',
            'approved_by_details',
            'related_subscription',
            'subscription_details'
        ]
        read_only_fields = ['timestamp']