from rest_framework import serializers
from .models import Ticket, TicketType
from core.models import Club
from accounts.models import User

class TicketTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketType
        fields = ['id', 'name', 'price']

class TicketSerializer(serializers.ModelSerializer):
    ticket_type = TicketTypeSerializer(read_only=True)
    ticket_type_id = serializers.PrimaryKeyRelatedField(
        queryset=TicketType.objects.all(), 
        source='ticket_type', 
        write_only=True,
        required=True  
    )
    club = serializers.PrimaryKeyRelatedField(queryset=Club.objects.all())
    issued_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Ticket
        fields = [
            'id', 'serial_number', 'ticket_type', 'ticket_type_id', 'price',
            'issue_datetime', 'issued_by', 'club', 'notes'
        ]
        read_only_fields = ['serial_number', 'price', 'issued_by', 'club']

    def validate(self, data):
        if 'ticket_type' not in data:
            raise serializers.ValidationError({"ticket_type_id": "نوع التذكرة مطلوب."})
        if 'notes' not in data:
            raise serializers.ValidationError({"notes": "الملاحظات مطلوبة."})
        return data
    

class TicketTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketType
        fields = ['id', 'name', 'price', 'description']  
        read_only_fields = ['id']  

    def validate(self, data):
        if 'name' not in data or not data['name']:
            raise serializers.ValidationError({"name": "اسم نوع التذكرة مطلوب."})
        if 'price' not in data or data['price'] < 0:
            raise serializers.ValidationError({"price": "السعر يجب أن يكون أكبر من أو يساوي الصفر."})
        return data
    def validate_name(self, value):
        if TicketType.objects.filter(club=self.context['request'].user.club, name=value).exists():
            raise serializers.ValidationError("نوع التذكرة بهذا الاسم موجود بالفعل.")
        return value