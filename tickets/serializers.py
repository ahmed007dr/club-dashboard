
from rest_framework import serializers
from .models import Ticket, TicketType, TicketBook
from core.models import Club
from accounts.models import User

class TicketTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketType
        fields = ['id', 'name', 'price']

class TicketBookSerializer(serializers.ModelSerializer):
    ticket_type = TicketTypeSerializer(read_only=True)
    ticket_type_id = serializers.PrimaryKeyRelatedField(
        queryset=TicketType.objects.all(), source='ticket_type', write_only=True
    )
    remaining_tickets = serializers.SerializerMethodField()

    class Meta:
        model = TicketBook
        fields = ['id', 'serial_prefix', 'total_tickets', 'ticket_type', 'ticket_type_id', 'remaining_tickets', 'club', 'issued_date']

    def get_remaining_tickets(self, obj):
        return obj.remaining_tickets()


class TicketSerializer(serializers.ModelSerializer):
    ticket_type = TicketTypeSerializer(read_only=True)
    ticket_type_id = serializers.PrimaryKeyRelatedField(
        queryset=TicketType.objects.all(), 
        source='ticket_type', 
        write_only=True,
        required=True  
    )
    book = TicketBookSerializer(read_only=True)
    book_id = serializers.PrimaryKeyRelatedField(
        queryset=TicketBook.objects.all(),
        source='book',
        write_only=True,
        required=False 
    )
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'serial_number', 'ticket_type', 'ticket_type_id', 'price',
            'issue_datetime', 'issued_by', 'club', 'book', 'book_id'
        ]
        read_only_fields = ['serial_number', 'price', 'issued_by', 'club'] 

    def validate(self, data):
        if 'ticket_type' not in data:
            raise serializers.ValidationError({"ticket_type_id": "This field is required."})
        return data