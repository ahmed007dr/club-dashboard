from rest_framework import serializers
from .models import Ticket, TicketType, TicketBook
from members.serializers import MemberSerializer
from core.serializers import ClubSerializer
from accounts.serializers import UserSerializer

class TicketTypeSerializer(serializers.ModelSerializer):
    club_name = serializers.CharField(source='club.name', read_only=True)

    class Meta:
        model = TicketType
        fields = ['id', 'club', 'club_name', 'name', 'price', 'description']

class TicketBookSerializer(serializers.ModelSerializer):
    ticket_type = TicketTypeSerializer(read_only=True)
    remaining_tickets = serializers.SerializerMethodField()

    def get_remaining_tickets(self, obj):
        return obj.remaining_tickets()

    class Meta:
        model = TicketBook
        fields = ['id', 'serial_prefix', 'total_tickets', 'ticket_type', 'remaining_tickets']

class TicketSerializer(serializers.ModelSerializer):
    club_name = serializers.CharField(source='club.name', read_only=True)
    ticket_type_details = TicketTypeSerializer(source='ticket_type', read_only=True)
    issued_by_details = UserSerializer(source='issued_by', read_only=True)
    book = TicketBookSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'club', 'club_name', 'notes', 'ticket_type', 'ticket_type_details',
            'price', 'issue_datetime', 'issued_by', 'issued_by_details', 'book', 'serial_number'
        ]
        extra_kwargs = {
            'issue_datetime': {'read_only': True},
            'issued_by': {'read_only': True},
            'price': {'read_only': True},
            'serial_number': {'read_only': True},  
        }

    def validate(self, data):
        if not data.get('ticket_type'):
            raise serializers.ValidationError("نوع التذكرة مطلوب")
        if not data.get('notes'):
            raise serializers.ValidationError("الملاحظات مطلوبة")
        return data