from rest_framework import serializers
from .models import Shift, StaffAttendance
from core.serializers import ClubSerializer
from accounts.serializers import UserSerializer
from datetime import datetime
from django.utils import timezone

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
        read_only_fields = ['date', 'shift_start']
        extra_kwargs = {
            'approved_by': {'required': False}
        }
    def validate(self, data):
        shift_end = data.get('shift_end')
        date = data.get('date')

        if not date and self.instance:
            date = self.instance.date

        if not date:
            date = timezone.localdate()

        if shift_end:
            try:
                shift_end_dt = datetime.combine(date, shift_end)
                if timezone.now() >= timezone.make_aware(shift_end_dt):
                    raise serializers.ValidationError("وقت نهاية الشيفت يجب أن يكون في المستقبل.")
            except Exception as e:
                raise serializers.ValidationError(f"خطأ في وقت النهاية: {str(e)}")

        return data



class StaffAttendanceSerializer(serializers.ModelSerializer):
    duration_hours = serializers.SerializerMethodField()
    shift_details = ShiftSerializer(source='shift', read_only=True)
    staff_details = UserSerializer(source='staff', read_only=True)

    class Meta:
        model = StaffAttendance
        fields = [
            'id',
            'staff',
            'staff_details',
            'club',
            'check_in',
            'check_out',
            'shift',
            'shift_details',
            'duration_hours'
        ]

    def get_duration_hours(self, obj):
        return obj.duration_hours()

