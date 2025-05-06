from rest_framework import serializers
from .models import FreeInvite
from core.serializers import ClubSerializer
from accounts.serializers import UserSerializer
from members.serializers import MemberSerializer
from members.models import Member

class MemberByMembershipNumberField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        try:
            return Member.objects.get(membership_number=data)
        except Member.DoesNotExist:
            raise serializers.ValidationError("عضو غير موجود برقم العضوية المدخل.")

    def to_representation(self, value):
        return value.membership_number


class FreeInviteSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    invited_by = MemberByMembershipNumberField(
        queryset=Member.objects.all(), required=False, allow_null=True
    )
    invited_by_details = MemberSerializer(source='invited_by', read_only=True)
    handled_by_details = UserSerializer(source='handled_by', read_only=True)
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
            'handled_by',
            'handled_by_details'
        ]
        extra_kwargs = {
            'handled_by': {'required': False}
        }

    def validate(self, data):
        if data.get('status') == 'used' and not data.get('handled_by'):
            raise serializers.ValidationError("Handled by is required when status is 'used'")
        return data
