from rest_framework import serializers
from .models import Attendance, EntryLog
from members.models import Member
from members.serializers import MemberSerializer
from subscriptions.models import Subscription
from subscriptions.serializers import SubscriptionSerializer
from core.serializers import ClubSerializer
from accounts.serializers import UserSerializer
from django.db.models import Q
from django.utils import timezone
from django.db.models import Case, When, F, BooleanField

class AttendanceSerializer(serializers.ModelSerializer):
    identifier = serializers.CharField(write_only=True)
    subscription_id = serializers.IntegerField(write_only=True, required=False)
    membership_number = serializers.SerializerMethodField()
    member_name = serializers.SerializerMethodField()
    rfid_code = serializers.SerializerMethodField()
    subscription_details = SubscriptionSerializer(source='subscription', read_only=True)
    timestamp = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id',
            'identifier',
            'subscription_id',
            'subscription',
            'subscription_details',
            'timestamp',
            'membership_number',
            'member_name',
            'rfid_code',
        ]
        read_only_fields = ['timestamp', 'membership_number', 'member_name', 'rfid_code', 'subscription']

    def get_membership_number(self, obj):
        return obj.subscription.member.membership_number

    def get_member_name(self, obj):
        return obj.subscription.member.name

    def get_rfid_code(self, obj):
        return obj.subscription.member.rfid_code

    def validate(self, data):
        identifier = data.get('identifier')
        subscription_id = data.get('subscription_id')
        
        if not identifier:
            raise serializers.ValidationError({'identifier': 'حقل identifier مطلوب'})

        try:
            member = Member.objects.get(Q(rfid_code=identifier) | Q(phone=identifier))
        except Member.DoesNotExist:
            raise serializers.ValidationError({'identifier': 'لم يتم العثور على عضو'})

        today = timezone.now().date()
        active_subscriptions = Subscription.objects.filter(
            member=member,
            club=self.context['request'].user.club,
            start_date__lte=today,
            end_date__gte=today,
            type__is_active=True,
            is_cancelled=False
        ).annotate(
            can_enter=Case(
                When(type__max_entries=0, then=True),
                When(entry_count__lt=F('type__max_entries'), then=True),
                default=False,
                output_field=BooleanField()
            )
        ).filter(can_enter=True)

        if not active_subscriptions.exists():
            raise serializers.ValidationError({'subscription': 'لا يوجد اشتراكات فعالة لهذا العضو'})

        if subscription_id:
            subscription = active_subscriptions.filter(id=subscription_id).first()
            if not subscription:
                raise serializers.ValidationError({'subscription_id': 'الاشتراك المحدد غير نشط أو غير موجود'})
        else:
            subscription = active_subscriptions.first()

        data['subscription'] = subscription
        data['timestamp'] = timezone.now().astimezone(timezone.get_current_timezone())
        return data

    def create(self, validated_data):
        validated_data.pop('identifier', None)
        validated_data.pop('subscription_id', None)
        return Attendance.objects.create(**validated_data)


class EntryLogSerializer(serializers.ModelSerializer):
    identifier = serializers.CharField(write_only=True)
    member_name = serializers.SerializerMethodField()
    rfid_code = serializers.SerializerMethodField()  
    club_details = ClubSerializer(source='club', read_only=True)
    approved_by_details = UserSerializer(source='approved_by', read_only=True)
    subscription_details = SubscriptionSerializer(source='related_subscription', read_only=True)

    class Meta:
        model = EntryLog
        fields = [
            'timestamp',
            'identifier',
            'related_subscription',
            'club',
            'approved_by',
            'member_name',
            'rfid_code',  
            'club_details',
            'approved_by_details',
            'subscription_details',
        ]
        read_only_fields = ['timestamp', 'member_name', 'rfid_code', 'related_subscription']

    def get_member_name(self, obj):
        return obj.member.name

    def get_rfid_code(self, obj):
        return obj.member.rfid_code  

    def create(self, validated_data):
        identifier = validated_data.pop('identifier')

        try:
            member = Member.objects.get(
                Q(rfid_code=identifier) |
                Q(phone=identifier)
            )
        except Member.DoesNotExist:
            raise serializers.ValidationError({'identifier': 'لم يتم العثور على عضو بالـ RFID أو رقم الهاتف أو رقم العضوية المقدم'})

        today = timezone.now().date()
        active_subscription = Subscription.objects.filter(
            member=member,
            start_date__lte=today,
            end_date__gte=today
        ).first()

        if not active_subscription:
            raise serializers.ValidationError({'subscription': 'لا يوجد اشتراك فعال لهذا العضو'})

        validated_data['member'] = member
        validated_data['related_subscription'] = active_subscription
        return super().create(validated_data)