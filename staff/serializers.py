from rest_framework import serializers
from .models import Shift
from core.serializers import ClubSerializer, UserSerializer

class ShiftSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    staff_details = UserSerializer(source='staff', read_only=True)
    approved_by_details = UserSerializer(source='approved_by', read_only=True)
    
    class Meta:
        model = Shift
        fields = [
            'id',
            'club',
            'club_details',
            'staff',
            'staff_details',
            'date',
            'shift_start',
            'shift_end',
            'approved_by',
            'approved_by_details'
        ]
        extra_kwargs = {
            'approved_by': {'required': False}
        }

    def validate(self, data):
        if data.get('shift_start') and data.get('shift_end'):
            if data['shift_start'] >= data['shift_end']:
                raise serializers.ValidationError("Shift end time must be after start time")
        return data