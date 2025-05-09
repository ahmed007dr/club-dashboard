from rest_framework import serializers
from .models import Member

class MemberSerializer(serializers.ModelSerializer):
    referred_by_name = serializers.CharField(source='referred_by.name', read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)

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
            'referred_by_name'
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
