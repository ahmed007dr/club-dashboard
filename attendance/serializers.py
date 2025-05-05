from rest_framework import serializers
from .models import Attendance, EntryLog
from members.serializers import MemberSerializer
from subscriptions.serializers import SubscriptionSerializer
from core.serializers import ClubSerializer
from accounts.serializers import  UserSerializer
from members.models import Member



class AttendanceSerializer(serializers.ModelSerializer):
    membership_number = serializers.SerializerMethodField()
    member_name = serializers.SerializerMethodField()
    subscription_details = SubscriptionSerializer(source='subscription', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            # 'id',
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
    membership_number = serializers.CharField(write_only=True)
    member_name = serializers.SerializerMethodField()
    club_details = ClubSerializer(source='club', read_only=True)
    approved_by_details = UserSerializer(source='approved_by', read_only=True)
    subscription_details = SubscriptionSerializer(source='related_subscription', read_only=True)

    class Meta:
        model = EntryLog
        fields = [
            'timestamp',
            'membership_number',  # incoming from POST
            'related_subscription',
            'club',
            'approved_by',
            'member_name',
            'club_details',
            'approved_by_details',
            'subscription_details',
        ]
        read_only_fields = ['timestamp', 'member_name']

    def get_member_name(self, obj):
        return obj.member.name

    def create(self, validated_data):
        membership_number = validated_data.pop('membership_number')
        try:
            member = Member.objects.get(membership_number=membership_number)
        except Member.DoesNotExist:
            raise serializers.ValidationError({'membership_number': 'Member not found'})
        validated_data['member'] = member
        return super().create(validated_data)
