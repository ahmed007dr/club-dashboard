from rest_framework import serializers
from .models import FreeInvite
from core.serializers import ClubSerializer
from accounts.serializers import UserSerializer
from members.serializers import MemberSerializer
from members.models import Member
from django.db import models

class MemberByMembershipNumberField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        try:
            return Member.objects.get(membership_number=data)
        except Member.DoesNotExist:
            # raise serializers.ValidationError("عضو غير موجود برقم العضوية المدخل.")
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
            ]

    def validate(self, data):
        if data.get('status') == 'used':
            pass  
        return data

