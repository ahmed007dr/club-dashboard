from rest_framework import serializers
from .models import Attendance, EntryLog
from members.serializers import MemberSerializer
from subscriptions.serializers import SubscriptionSerializer
from core.serializers import ClubSerializer
from accounts.serializers import  UserSerializer




class AttendanceSerializer(serializers.ModelSerializer):
    membership_number = serializers.SerializerMethodField()
    member_name = serializers.SerializerMethodField()
    subscription_details = SubscriptionSerializer(source='subscription', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id',
            'subscription',
            'subscription_details',
            'attendance_date',
            'membership_number',
            'member_name',
        ]

    def get_membership_number(self, obj):
        return obj.subscription.member.membership_number

    def get_member_name(self, obj):
        return obj.subscription.member.name

class EntryLogSerializer(serializers.ModelSerializer):
    membership_number = serializers.SerializerMethodField()
    member_name = serializers.SerializerMethodField()
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
            'subscription_details',
            'membership_number',
            'member_name',
        ]
        read_only_fields = ['timestamp']

    def get_membership_number(self, obj):
        return obj.member.membership_number

    def get_member_name(self, obj):
        return obj.member.name
