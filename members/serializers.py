from rest_framework import serializers
from django.utils import timezone
from .models import Member
from attendance.models import Attendance

class MemberSerializer(serializers.ModelSerializer):
    referred_by_name = serializers.CharField(source='referred_by.name', read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)
    last_attendance_date = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = [
            'id',
            'club',
            'club_name',
            'name',
            'membership_number',
            'rfid_code',
            'national_id',
            'birth_date',
            'phone',
            'phone2',
            'photo',
            'job',
            'address',
            'note',
            'created_at',
            'referred_by',
            'referred_by_name',
            'last_attendance_date',
        ]
        extra_kwargs = {
            'photo': {'required': False, 'allow_null': True},
            'referred_by': {'required': False, 'allow_null': True},
            'rfid_code': {'required': False, 'allow_null': True},
            'phone2': {'required': False, 'allow_null': True},
            'job': {'required': False, 'allow_null': True},
            'address': {'required': False, 'allow_null': True},
            'note': {'required': False, 'allow_null': True},
            'national_id': {'required': False, 'allow_null': True},
        }

    def get_last_attendance_date(self, obj):
        last_attendance = Attendance.objects.filter(
            subscription__member=obj,
            subscription__end_date__gte=timezone.now().date()
        ).order_by('-attendance_date').first()
        return last_attendance.attendance_date if last_attendance else None
