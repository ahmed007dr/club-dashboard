from datetime import datetime
from dateutil.relativedelta import relativedelta
from django.db.models import Sum, Count, ExpressionWrapper, F, DurationField
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from rest_framework import serializers
from .models import Shift, StaffAttendance
from core.serializers import ClubSerializer
from employees.models import Employee  # استيراد Employee
from employees.serializers import EmployeeSerializer  # استيراد Serializer
from accounts.serializers import UserSerializer

class ShiftSerializer(serializers.ModelSerializer):
    """Serializer for Shift model."""
    club_details = ClubSerializer(source='club', read_only=True)
    staff_details = EmployeeSerializer(source='staff', read_only=True)  # تغيير لـ EmployeeSerializer
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
        date = data.get('date')
        shift_start = data.get('shift_start')
        shift_end = data.get('shift_end')
        shift_end_date = data.get('shift_end_date', date)

        if not date or not shift_start or not shift_end:
            raise serializers.ValidationError("Date, shift start, and shift end are required.")

        try:
            shift_start_dt = datetime.combine(date, shift_start)
            shift_end_dt = datetime.combine(shift_end_date or date, shift_end)
        except TypeError as e:
            raise serializers.ValidationError(f"Invalid date or time format: {str(e)}")

        shift_end_aware = timezone.make_aware(shift_end_dt)
        if timezone.now() >= shift_end_aware:
            raise serializers.ValidationError("Shift end time must be in the future.")

        if shift_end_date and shift_end_date != date and shift_end_date != (date + timezone.timedelta(days=1)):
            raise serializers.ValidationError("Shift end date must be either the same as start date or the next day.")

        if shift_end_dt < shift_start_dt and not shift_end_date:
            data['shift_end_date'] = date + timezone.timedelta(days=1)

        return data

class StaffAttendanceSerializer(serializers.ModelSerializer):
    duration_hours = serializers.SerializerMethodField()
    shift_details = ShiftSerializer(source='shift', read_only=True)
    staff_details = EmployeeSerializer(source='staff', read_only=True) 
    club_details = ClubSerializer(source='club', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = StaffAttendance
        fields = [
            'id', 'staff', 'staff_details', 'club', 'club_details',
            'check_in', 'check_out', 'shift', 'shift_details',
            'duration_hours', 'created_by', 'created_by_details'
        ]

    def get_duration_hours(self, obj):
        return obj.duration_hours()

    def validate(self, data):
        check_in = data.get('check_in')
        staff = data.get('staff')
        check_in_date = check_in.date()
        if StaffAttendance.objects.filter(staff=staff, check_in__date=check_in_date).exists():
            raise serializers.ValidationError({
                'check_in': 'تم تسجيل حضور لهذا الموظف اليوم.'
            })
        return data

class MonthlyDataSerializer(serializers.Serializer):
    month = serializers.CharField()
    total_hours = serializers.FloatField()
    expected_hours = serializers.FloatField(default=168.0) 
    hours_status = serializers.CharField()
    attendance_days = serializers.IntegerField()
    total_salary = serializers.FloatField()
    hours_change = serializers.FloatField()
    percentage_change = serializers.FloatField()

class StaffMonthlyHoursSerializer(serializers.Serializer):
    staff_id = serializers.IntegerField()
    full_name = serializers.CharField()  
    monthly_data = MonthlyDataSerializer(many=True)

    class Meta:
        fields = [
            'staff_id',
            'full_name',
            'monthly_data'
        ]