from rest_framework import serializers
from django.contrib.auth.models import Permission, Group
from core.models import Club
from .models import User
from django.contrib.auth import authenticate

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
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'role', 'club',
            'rfid_code', 'phone_number', 'notes', 'card_number', 'address', 'is_active', 'password'
        ]
        extra_kwargs = {
            'rfid_code': {'required': False, 'allow_null': True},
            'club': {'required': False, 'allow_null': True},
            'phone_number': {'required': False, 'allow_null': True, 'allow_blank': True},
            'notes': {'required': False, 'allow_null': True, 'allow_blank': True},
            'card_number': {'required': False, 'allow_null': True, 'allow_blank': True},
            'address': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password and user.role in ['owner', 'admin', 'reception']:
            user.set_password(password)
        else:
            user.set_unusable_password()  
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password and instance.role in ['owner', 'admin', 'reception']:
            instance.set_password(password)
        instance.save()
        return instance
    

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
            'phone_number',
            'notes',
            'card_number',
            'address',
            'is_active',
            'permissions',
            'groups',
        ]
        extra_kwargs = {
            'rfid_code': {'required': False, 'allow_null': True},
            'email': {'required': False, 'allow_blank': True},
            'phone_number': {'required': False, 'allow_null': True, 'allow_blank': True},
            'notes': {'required': False, 'allow_null': True, 'allow_blank': True},
            'card_number': {'required': False, 'allow_null': True, 'allow_blank': True},
            'address': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

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

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials.")

        # Restrict login to owner, admin, and reception roles
        if user.role not in ['owner', 'admin', 'reception']:
            raise serializers.ValidationError("This role cannot log in with username and password.")

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
   