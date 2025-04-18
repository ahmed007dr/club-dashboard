from rest_framework import serializers
from .models import User, Club

class ClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ['id', 'name', 'location', 'logo', 'created_at']
        read_only_fields = ('created_at',)

class UserClubSerializer(serializers.ModelSerializer): # list only one club not all
    class Meta:
        model = Club
        fields = ['id', 'name', 'logo']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class UserProfileSerializer(serializers.ModelSerializer):
    club = UserClubSerializer(read_only=True)
    
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
            'is_active'
        ]