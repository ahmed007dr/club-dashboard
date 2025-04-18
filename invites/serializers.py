from rest_framework import serializers
from .models import FreeInvite
from core.serializers import ClubSerializer, UserSerializer
from members.serializers import MemberSerializer

class FreeInviteSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
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
            'invited_by': {'required': False},
            'handled_by': {'required': False}
        }

    def validate(self, data):
        if data.get('status') == 'used' and not data.get('handled_by'):
            raise serializers.ValidationError("Handled by is required when status is 'used'")
        return data