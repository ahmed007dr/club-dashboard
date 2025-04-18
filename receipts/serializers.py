from rest_framework import serializers
from .models import Receipt
from members.serializers import MemberSerializer
from subscriptions.serializers import SubscriptionSerializer
from core.serializers import ClubSerializer, UserSerializer

class ReceiptSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    member_details = MemberSerializer(source='member', read_only=True)
    subscription_details = SubscriptionSerializer(source='subscription', read_only=True)
    issued_by_details = UserSerializer(source='issued_by', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Receipt
        fields = [
            'id',
            'club',
            'club_details',
            'member',
            'member_details',
            'subscription',
            'subscription_details',
            'date',
            'amount',
            'payment_method',
            'payment_method_display',
            'note',
            'issued_by',
            'issued_by_details',
            'invoice_number'
        ]
        read_only_fields = ['date', 'invoice_number']
        extra_kwargs = {
            'issued_by': {'required': False}
        }

    def validate(self, data):
        if data.get('subscription') and data['subscription'].member != data.get('member'):
            raise serializers.ValidationError("Subscription must belong to the selected member")
        return data