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

class AttendanceSerializer(serializers.ModelSerializer):
    identifier = serializers.CharField(write_only=True)
    membership_number = serializers.SerializerMethodField()
    member_name = serializers.SerializerMethodField()
    rfid_code = serializers.SerializerMethodField()  
    subscription_details = SubscriptionSerializer(source='subscription', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id',
            'identifier',
            'subscription',
            'subscription_details',
            'attendance_date',
            'entry_time', 
            'membership_number',
            'member_name',
            'rfid_code',  
        ]
        read_only_fields = ['attendance_date', 'entry_time', 'membership_number', 'member_name', 'rfid_code', 'subscription']

    def get_membership_number(self, obj):
        print(f"تم تنفيذ خطوة: جلب رقم العضوية للعضو في AttendanceSerializer، العضو ID = {obj.subscription.member.id}")
        membership_number = obj.subscription.member.membership_number
        print(f"تم تنفيذ خطوة: نجاح جلب رقم العضوية = {membership_number}")
        return membership_number

    def get_member_name(self, obj):
        print(f"تم تنفيذ خطوة: جلب اسم العضو في AttendanceSerializer، العضو ID = {obj.subscription.member.id}")
        member_name = obj.subscription.member.name
        print(f"تم تنفيذ خطوة: نجاح جلب اسم العضو = {member_name}")
        return member_name

    def get_rfid_code(self, obj):
        print(f"تم تنفيذ خطوة: جلب RFID كود في AttendanceSerializer، العضو ID = {obj.subscription.member.id}")
        rfid_code = obj.subscription.member.rfid_code
        print(f"تم تنفيذ خطوة: نجاح جلب RFID كود = {rfid_code}")
        return rfid_code  

    def to_internal_value(self, data):
        print("تم تنفيذ خطوة: بدء تحويل البيانات المدخلة في AttendanceSerializer")
        print(f"تم تنفيذ خطوة: البيانات المرسلة = {data}")
        try:
            validated_data = super().to_internal_value(data)
            print("تم تنفيذ خطوة: نجاح تحويل البيانات المدخلة إلى قيم داخلية")
            return validated_data
        except serializers.ValidationError as e:
            print("تم تنفيذ خطوة: فشل تحويل البيانات المدخلة، الأخطاء:", e.detail)
            raise

    def create(self, validated_data):
        print("تم تنفيذ خطوة: بدء إنشاء سجل حضور في AttendanceSerializer")
        print(f"تم تنفيذ خطوة: البيانات المحققة = {validated_data}")

        identifier = validated_data.pop('identifier')
        print(f"تم تنفيذ خطوة: جلب identifier = {identifier}")

        try:
            member = Member.objects.get(
                Q(rfid_code=identifier) |
                Q(phone=identifier)
            )
            print(f"تم تنفيذ خطوة: نجاح جلب العضو، العضو ID = {member.id}, الاسم = {member.name}")
        except Member.DoesNotExist:
            print("تم تنفيذ خطوة: فشل جلب العضو - لا يوجد عضو بالـ identifier المقدم")
            raise serializers.ValidationError({'identifier': 'لم يتم العثور على عضو بالـ RFID أو رقم الهاتف أو رقم العضوية المقدم'})

        today = timezone.now().date()
        print(f"تم تنفيذ خطوة: جلب تاريخ اليوم = {today}")

        active_subscription = Subscription.objects.filter(
            member=member,
            start_date__lte=today,
            end_date__gte=today
        ).first()
        print("تم تنفيذ خطوة: البحث عن اشتراك فعال للعضو")

        if not active_subscription:
            print("تم تنفيذ خطوة: فشل التحقق - لا يوجد اشتراك فعال")
            raise serializers.ValidationError({'subscription': 'لا يوجد اشتراك فعال لهذا العضو'})
        print(f"تم تنفيذ خطوة: نجاح جلب اشتراك فعال، الاشتراك ID = {active_subscription.id}")

        validated_data['subscription'] = active_subscription
        print("تم تنفيذ خطوة: إضافة الاشتراك إلى البيانات المحققة")

        attendance = super().create(validated_data)
        print(f"تم تنفيذ خطوة: نجاح إنشاء سجل الحضور، ID = {attendance.id}")
        return attendance
    
    
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
        print(f"تم تنفيذ خطوة: جلب اسم العضو في EntryLogSerializer، العضو ID = {obj.member.id}")
        member_name = obj.member.name
        print(f"تم تنفيذ خطوة: نجاح جلب اسم العضو = {member_name}")
        return member_name

    def get_rfid_code(self, obj):
        print(f"تم تنفيذ خطوة: جلب RFID كود في EntryLogSerializer، العضو ID = {obj.member.id}")
        rfid_code = obj.member.rfid_code
        print(f"تم تنفيذ خطوة: نجاح جلب RFID كود = {rfid_code}")
        return rfid_code  

    def to_internal_value(self, data):
        print("تم تنفيذ خطوة: بدء تحويل البيانات المدخلة في EntryLogSerializer")
        print(f"تم تنفيذ خطوة: البيانات المرسلة = {data}")
        try:
            validated_data = super().to_internal_value(data)
            print("تم تنفيذ خطوة: نجاح تحويل البيانات المدخلة إلى قيم داخلية")
            return validated_data
        except serializers.ValidationError as e:
            print("تم تنفيذ خطوة: فشل تحويل البيانات المدخلة، الأخطاء:", e.detail)
            raise

    def create(self, validated_data):
        print("تم تنفيذ خطوة: بدء إنشاء سجل دخول في EntryLogSerializer")
        print(f"تم تنفيذ خطوة: البيانات المحققة = {validated_data}")

        identifier = validated_data.pop('identifier')
        print(f"تم تنفيذ خطوة: جلب identifier = {identifier}")

        try:
            member = Member.objects.get(
                Q(rfid_code=identifier) |
                Q(phone=identifier)
            )
            print(f"تم تنفيذ خطوة: نجاح جلب العضو، العضو ID = {member.id}, الاسم = {member.name}")
        except Member.DoesNotExist:
            print("تم تنفيذ خطوة: فشل جلب العضو - لا يوجد عضو بالـ identifier المقدم")
            raise serializers.ValidationError({'identifier': 'لم يتم العثور على عضو بالـ RFID أو رقم الهاتف أو رقم العضوية المقدم'})

        today = timezone.now().date()
        print(f"تم تنفيذ خطوة: جلب تاريخ اليوم = {today}")

        active_subscription = Subscription.objects.filter(
            member=member,
            start_date__lte=today,
            end_date__gte=today
        ).first()
        print("تم تنفيذ |خطوة: البحث عن اشتراك فعال للعضو")

        if not active_subscription:
            print("تم تنفيذ خطوة: فشل التحقق - لا يوجد اشتراك فعال")
            raise serializers.ValidationError({'subscription': 'لا يوجد اشتراك فعال لهذا العضو'})
        print(f"تم تنفيذ خطوة: نجاح جلب اشتراك فعال، الاشتراك ID = {active_subscription.id}")

        validated_data['member'] = member
        validated_data['related_subscription'] = active_subscription
        print("تم تنفيذ خطوة: إضافة العضو والاشتراك إلى البيانات المحققة")

        entry_log = super().create(validated_data)
        print(f"تم تنفيذ خطوة: نجاح إنشاء سجل الدخول، ID = {entry_log.id}")
        return entry_log