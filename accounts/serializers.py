from rest_framework import serializers
from core.models import Club
from .models import User


class ClubMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ['id', 'name', 'logo']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'role',
            'club',
            'rfid_code',
            'is_active'
        ]
        extra_kwargs = {
            'rfid_code': {'required': False, 'allow_null': True},
            'club': {'required': False, 'allow_null': True},
        }


class UserProfileSerializer(serializers.ModelSerializer):
    club = ClubMiniSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'club',
            'rfid_code',
            'is_active'
        ]
        extra_kwargs = {
            'rfid_code': {'required': False, 'allow_null': True},
        }


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            return data
        raise serializers.ValidationError("Username and password are required")

class RFIDLoginSerializer(serializers.Serializer):
    rfid_code = serializers.CharField()

    def validate(self, data):
        rfid_code = data.get('rfid_code')

        if not rfid_code:
            raise serializers.ValidationError("RFID code is required.")

        try:
            user = User.objects.get(rfid_code=rfid_code)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid RFID code.")

        if not user.is_active:
            raise serializers.ValidationError("User account is inactive.")

        data['user'] = user
        return data
