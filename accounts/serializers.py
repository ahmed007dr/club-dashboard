from rest_framework import serializers
from django.contrib.auth.models import Permission, Group
from core.models import Club
from .models import User
from django.contrib.auth.hashers import make_password

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
            'id', 'username', 'first_name', 'last_name', 'email', 'role',
            'club', 'rfid_code', 'phone', 'birth_date', 'qualifications', 'is_active'
        ]
        extra_kwargs = {
            'username': {'required': False, 'allow_blank': True},
            'email': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
            'birth_date': {'required': False, 'allow_null': True},
            'qualifications': {'required': False, 'allow_blank': True},
            'rfid_code': {'required': True, 'allow_blank': False},
            'is_active': {'read_only': True}
        }

class UserProfileSerializer(serializers.ModelSerializer):
    club = ClubMiniSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()
    groups = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'club', 'rfid_code', 'phone', 'birth_date', 'qualifications',
            'is_active', 'permissions', 'groups'
        ]
        extra_kwargs = {
            'username': {'required': False, 'allow_blank': True},
            'email': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
            'birth_date': {'required': False, 'allow_null': True},
            'qualifications': {'required': False, 'allow_blank': True},
            'rfid_code': {'required': True, 'allow_blank': False},
            'is_active': {'read_only': True}
        }

    def validate(self, data):
        role = data.get('role', self.instance.role if self.instance else None)

        if role in ['owner', 'admin', 'reception']:
            if not data.get('username'):
                raise serializers.ValidationError("Username is required for owner, admin, and reception roles.")
            if not data.get('password') and not self.instance:
                raise serializers.ValidationError("Password is required for owner, admin, and reception roles.")
            data['is_active'] = True
        else:
            data['username'] = None
            data['is_active'] = False

        return data


    def create(self, validated_data):
        if validated_data.get('password'):
            validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.get('password'):
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)

    def get_permissions(self, user):
        direct_permissions = list(user.user_permissions.values_list('codename', flat=True))
        group_permissions = []
        if user.groups.exists():
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