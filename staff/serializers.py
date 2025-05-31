from datetime import datetime

from dateutil.relativedelta import relativedelta
from django.db.models import Sum, Count, ExpressionWrapper, F, DurationField
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from rest_framework import serializers

from .models import Shift, StaffAttendance
from core.serializers import ClubSerializer
from accounts.serializers import UserSerializer

class ShiftSerializer(serializers.ModelSerializer):
    """Serializer for Shift model, handling shift creation and validation."""
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
            'shift_end_date',
            'approved_by',
            'approved_by_details'
        ]
        extra_kwargs = {
            'approved_by': {'required': False, 'allow_null': True},
            'shift_end_date': {'required': False, 'allow_null': True}
        }

    def validate(self, data):
        """Validate shift dates and times, ensuring logical consistency."""
        date = data.get('date')
        shift_start = data.get('shift_start')
        shift_end = data.get('shift_end')
        shift_end_date = data.get('shift_end_date', date)  # Default to same day if not provided

        if not date or not shift_start or not shift_end:
            raise serializers.ValidationError("Date, shift start, and shift end are required.")

        # Convert to datetime for validation
        try:
            shift_start_dt = datetime.combine(date, shift_start)
            shift_end_dt = datetime.combine(shift_end_date or date, shift_end)
        except TypeError as e:
            raise serializers.ValidationError(f"Invalid date or time format: {str(e)}")

        # Ensure shift end is in the future
        shift_end_aware = timezone.make_aware(shift_end_dt)
        if timezone.now() >= shift_end_aware:
            raise serializers.ValidationError("Shift end time must be in the future.")

        # Validate shift_end_date: must be same as date or the next day
        if shift_end_date and shift_end_date != date and shift_end_date != (date + timezone.timedelta(days=1)):
            raise serializers.ValidationError(
                "Shift end date must be either the same as start date or the next day."
            )

        # If shift_end is before shift_start, assume it spans to the next day
        if shift_end_dt < shift_start_dt and not shift_end_date:
            data['shift_end_date'] = date + timezone.timedelta(days=1)

        return data

class StaffAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for StaffAttendance model, including duration and shift details."""
    duration_hours = serializers.SerializerMethodField()
    shift_details = ShiftSerializer(source='shift', read_only=True)
    staff_details = UserSerializer(source='staff', read_only=True)
    club_details = ClubSerializer(source='club', read_only=True)

    class Meta:
        model = StaffAttendance
        fields = [
            'id',
            'staff',
            'staff_details',
            'club',
            'club_details',
            'check_in',
            'check_out',
            'shift',
            'shift_details',
            'duration_hours'
        ]

    def get_duration_hours(self, obj):
        """Calculate the duration of attendance in hours."""
        return obj.duration_hours()
    



class StaffMonthlyHoursSerializer(serializers.Serializer):
    staff_id = serializers.IntegerField(source='staff__id')
    staff_name = serializers.CharField(source='staff__username')
    rfid_code = serializers.CharField(source='staff__rfid_code')
    month = serializers.DateTimeField(format='%B %Y')
    total_hours = serializers.SerializerMethodField()
    attendance_days = serializers.IntegerField()
    hours_change = serializers.SerializerMethodField()
    percentage_change = serializers.SerializerMethodField()

    def get_total_hours(self, obj):
        return round(obj['total_hours'].total_seconds() / 3600, 2)

    def get_hours_change(self, obj):
        staff_id = obj['staff__id']
        month = obj['month']
        total_hours = obj['total_hours'].total_seconds() / 3600
        
        # Access context to get previous months' data
        monthly_data = self.context.get('monthly_data', {})
        prev_month = month - relativedelta(months=1)
        
        prev_hours = monthly_data.get(staff_id, {}).get(prev_month, 0)
        return round(total_hours - prev_hours, 2)

    def get_percentage_change(self, obj):
        staff_id = obj['staff__id']
        month = obj['month']
        total_hours = obj['total_hours'].total_seconds() / 3600
        
        monthly_data = self.context.get('monthly_data', {})
        prev_month = month - relativedelta(months=1)
        
        prev_hours = monthly_data.get(staff_id, {}).get(prev_month, 0)
        if prev_hours > 0:
            return round(((total_hours - prev_hours) / prev_hours) * 100, 2)
        return 0

    class Meta:
        fields = [
            'staff_id',
            'staff_name',
            'rfid_code',
            'month',
            'total_hours',
            'attendance_days',
            'hours_change',
            'percentage_change'
        ]