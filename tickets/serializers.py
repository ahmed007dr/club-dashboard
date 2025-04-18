from rest_framework import serializers
from .models import Ticket
from members.serializers import MemberSerializer  # Assuming you have a MemberSerializer

class TicketSerializer(serializers.ModelSerializer):
    club_name = serializers.CharField(source='club.name', read_only=True)
    used_by_details = MemberSerializer(source='used_by', read_only=True)
    ticket_type_display = serializers.CharField(source='get_ticket_type_display', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id',
            'club',
            'club_name',
            'buyer_name',
            'ticket_type',
            'ticket_type_display',
            'price',
            'used',
            'issue_date',
            'used_by',
            'used_by_details'
        ]
        extra_kwargs = {
            'issue_date': {'read_only': True},
        }

    def validate(self, data):
        if data.get('used') and not data.get('used_by'):
            raise serializers.ValidationError("You must specify who used the ticket when marking it as used.")
        return data