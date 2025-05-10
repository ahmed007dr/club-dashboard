from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Ticket
from .serializers import TicketSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub  
from finance.serializers import IncomeSerializer
from finance.models import Income
from django.utils import timezone
from django.forms.models import model_to_dict
from finance.models import Income,IncomeSource

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def ticket_list_api(request):

    if request.user.role == 'owner':
        tickets = Ticket.objects.select_related('club', 'used_by').all()  
    else:
        tickets = Ticket.objects.select_related('club', 'used_by').filter(club=request.user.club)  

    serializer = TicketSerializer(tickets, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_ticket_api(request):
    serializer = TicketSerializer(data=request.data)
    if serializer.is_valid():
        ticket = serializer.save()
        
    if ticket.price > 0:
        source, _ = IncomeSource.objects.get_or_create(
            club=ticket.club,
            name='Ticket',
            defaults={'description': 'ارباح بيع تذاكر'}
        )

        income = Income.objects.create(
            club=ticket.club,
            source=source,
            amount=ticket.price,
            description=f"بيع تذكره بنوع  {ticket.ticket_type}",
            date=timezone.now().date(),
            received_by=request.user
        )


        income_serializer = IncomeSerializer(data=income)

        if income_serializer.is_valid():
            income_serializer.save()

        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, ticket):
            ticket.delete()  
            return Response({'error': 'You do not have permission to create a ticket for this club'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def ticket_detail_api(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)

    serializer = TicketSerializer(ticket)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def edit_ticket_api(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)

    serializer = TicketSerializer(ticket, data=request.data)
    if serializer.is_valid():
        updated_ticket = serializer.save()

        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, updated_ticket):
            return Response({'error': 'You do not have permission to update this ticket to this club'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_ticket_api(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)

    ticket.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def mark_ticket_used_api(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    
    used_by_id = request.data.get('used_by') 
    
    if used_by_id:
        from members.models import Member
        if not Member.objects.filter(id=used_by_id).exists():
            return Response(
                {"error": "Invalid used_by ID"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    ticket.used = True
    ticket.used_by_id = used_by_id if used_by_id else None
    ticket.save()
    
    serializer = TicketSerializer(ticket)
    return Response(serializer.data, status=status.HTTP_200_OK)