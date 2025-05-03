from rest_framework import serializers
from .models import Subscription, SubscriptionType

# class SubscriptionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Subscription
#         fields = '__all__'

class SubscriptionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionType
        fields = '__all__'
        read_only_fields = ['end_date', 'remaining_amount']


class SubscriptionSerializer(serializers.ModelSerializer):
    type_details = SubscriptionTypeSerializer(source='type', read_only=True)
    member_name = serializers.CharField(source='member.name', read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id',
            'club',
            'club_name',
            'member',
            'member_name',
            'type',
            'type_details',
            'start_date',
            'end_date',
            'paid_amount',
            'remaining_amount',
            'attendance_days'
        ]
        extra_kwargs = {
            'remaining_amount': {'read_only': True}
        }

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("End date must be after start date")
        return data