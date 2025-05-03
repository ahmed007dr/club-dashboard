from rest_framework import serializers
from .models import Shift
from core.serializers import ClubSerializer
from accounts.serializers import UserSerializer
from .models import StaffAttendance


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

class StaffAttendanceSerializer(serializers.ModelSerializer):
    duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = StaffAttendance
        fields = ['id', 'staff', 'club', 'check_in', 'check_out', 'shift', 'duration_hours']

    def get_duration_hours(self, obj):
        return obj.duration_hours()
