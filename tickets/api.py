from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Ticket
from .serializers import TicketSerializer

@api_view(['GET'])
def ticket_list_api(request):
    tickets = Ticket.objects.select_related('club', 'used_by').all()
    serializer = TicketSerializer(tickets, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def add_ticket_api(request):
    serializer = TicketSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def ticket_detail_api(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    serializer = TicketSerializer(ticket)
    return Response(serializer.data)

@api_view(['PUT'])
def edit_ticket_api(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    serializer = TicketSerializer(ticket, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_ticket_api(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    ticket.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
def mark_ticket_used_api(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    used_by_id = request.data.get('used_by')
    
    if not used_by_id:
        return Response(
            {"error": "used_by field is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    ticket.used = True
    ticket.used_by_id = used_by_id
    ticket.save()
    
    serializer = TicketSerializer(ticket)
    return Response(serializer.data)