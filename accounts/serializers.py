from rest_framework import serializers
from django.contrib.auth.models import Permission, Group
from core.models import Club
from .models import User


class ClubMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ['id', 'name', 'logo']


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename']


class GroupSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions']


class UserSerializer(serializers.ModelSerializer):
    club = ClubMiniSerializer(read_only=True)

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
            'is_active',
        ]
        extra_kwargs = {
            'rfid_code': {'required': False, 'allow_null': True},
            'club': {'required': False, 'allow_null': True},
        }


class UserProfileSerializer(serializers.ModelSerializer):
    club = ClubMiniSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()
    groups = serializers.StringRelatedField(many=True, read_only=True)

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
            'is_active',
            'permissions',
            'groups',
        ]
        extra_kwargs = {
            'rfid_code': {'required': False, 'allow_null': True},
            'email': {'required': False, 'allow_blank': True},
        }

    def get_permissions(self, user):
        """
        Returns a unique list of permission codenames from both user_permissions and groups.
        Handles cases where user has no groups or permissions.
        """
        direct_permissions = list(user.user_permissions.values_list('codename', flat=True))
        
        group_permissions = []
        if user.groups.exists():  # Check if user has any groups
            group_permissions = list(
                Permission.objects.filter(group__in=user.groups.all()).values_list('codename', flat=True)
            )
        
        return list(set(direct_permissions + group_permissions))


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            raise serializers.ValidationError("Both username and password are required.")
        
        return data


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
