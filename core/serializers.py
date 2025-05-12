from rest_framework import serializers
from audit_trail.serializers import TimeStampedSerializer
from .models import Club

class ClubSerializer(TimeStampedSerializer):
    class Meta:
        model = Club
        fields = ['id', 'name', 'location', 'logo', 'created_by', 'created_at', 'updated_by', 'updated_at']
        read_only_fields = ('created_at',)
