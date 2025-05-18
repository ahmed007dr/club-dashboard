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
            'max_entries'
        ]
        extra_kwargs = {
            'club': {'required': True}
        }

    def to_internal_value(self, data):
        print("تم تنفيذ خطوة: بدء تحويل بيانات SubscriptionTypeSerializer")
        print(f"تم تنفيذ خطوة: البيانات المرسلة = {data}")
        return super().to_internal_value(data)


class SubscriptionSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    member_details = MemberSerializer(source='member', read_only=True)
    type_details = SubscriptionTypeSerializer(source='type', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'club', 'club_details', 'member', 'member_details',
            'type', 'type_details', 'start_date', 'end_date',
            'paid_amount', 'remaining_amount', 'entry_count'
        ]
        extra_kwargs = {
            'remaining_amount': {'read_only': True},
            'end_date': {'read_only': True},  
        }

    def validate(self, data):
        print("تم تنفيذ خطوة: بدء التحقق من بيانات SubscriptionSerializer")
        print(f"تم تنفيذ خطوة: البيانات المرسلة = {data}")

        club = data.get('club')
        subscription_type = data.get('type')
        start_date = data.get('start_date')
        member = data.get('member')

        # Validate club and subscription type consistency
        if club and subscription_type:
            print(f"تم تنفيذ خطوة: التحقق من تناسق النادي ونوع الاشتراك")
            if subscription_type.club != club:
                print("تم تنفيذ خطوة: فشل التحقق - نوع الاشتراك لا ينتمي للنادي")
                raise serializers.ValidationError("The subscription type must belong to the same club as the subscription.")
            print("تم تنفيذ خطوة: نجاح التحقق - نوع الاشتراك ينتمي للنادي")

        # Validate start_date
        if start_date:
            print(f"تم تنفيذ خطوة: التحقق من تاريخ البداية = {start_date}")
            if start_date < timezone.now().date():
                print("تم تنفيذ خطوة: فشل التحقق - تاريخ البداية في الماضي")
                raise serializers.ValidationError("تاريخ البداية لا يمكن أن يكون في الماضي.")
            print("تم تنفيذ خطوة: نجاح التحقق - تاريخ البداية صحيح")

        if member:
            print(f"تم تنفيذ خطوة: التحقق من وجود اشتراكات نشطة للعضو = {member}")
            today = timezone.now().date()
            active_subscriptions = Subscription.objects.filter(
                member=member,
                club=club,
                start_date__lte=today,
                end_date__gte=today
            ).exclude(
                entry_count__gte=models.F('type__max_entries')  # Exclude fully used subscriptions
            ).exclude(
                type__max_entries=0  # Include unlimited entries subscriptions
            )

            if active_subscriptions.exists() and not self.instance:
                print("تم تنفيذ خطوة: فشل التحقق - العضو لديه اشتراك نشط")
                raise serializers.ValidationError(
                    "هذا العضو لديه اشتراك نشط بالفعل. يرجى الانتظار حتى ينتهي أو تنفد الإدخالات."
                )
            print("تم تنفيذ خطوة: نجاح التحقق - لا يوجد اشتراكات نشطة")

            # Check for subscriptions with remaining_amount > 0
            print(f"تم تنفيذ خطوة: التحقق من وجود مبالغ غير مدفوعة للعضو = {member}")
            unpaid_subscriptions = Subscription.objects.filter(
                member=member,
                club=club,
                remaining_amount__gt=0
            )

            if unpaid_subscriptions.exists() and not self.instance:
                print("تم تنفيذ خطوة: فشل التحقق - العضو لديه مبالغ غير مدفوعة")
                raise serializers.ValidationError(
                    "هذا العضو لديه مبالغ غير مدفوعة لاشتراكات سابقة. يرجى تسوية جميع المدفوعات المستحقة قبل إنشاء اشتراك جديد."
                )
            print("تم تنفيذ خطوة: نجاح التحقق - لا يوجد مبالغ غير مدفوعة")

        print("تم تنفيذ خطوة: اكتمال التحقق من البيانات بنجاح")
        return data