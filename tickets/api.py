from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from .models import Ticket, TicketType
from .serializers import TicketSerializer, TicketTypeSerializer
from finance.models import Income, IncomeSource
from utils.permissions import IsOwnerOrRelatedToClub
from datetime import datetime

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 20

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def ticket_type_list_api(request):
    """List ticket types with optional name filter."""
    ticket_types = TicketType.objects.filter(club=request.user.club, price__gt=0)
    if request.query_params.get('name'):
        ticket_types = ticket_types.filter(name__icontains=request.query_params.get('name'))
    ticket_types = ticket_types.order_by('-id')
    paginator = StandardPagination()
    result_page = paginator.paginate_queryset(ticket_types, request)
    serializer = TicketTypeSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def ticket_list_api(request):
    """List tickets with optional filters."""
    tickets = Ticket.objects.select_related('club', 'ticket_type', 'issued_by').filter(club=request.user.club)
    if request.query_params.get('ticket_type'):
        tickets = tickets.filter(ticket_type__id=request.query_params.get('ticket_type'))
    if request.query_params.get('issue_date'):
        try:
            date_obj = datetime.strptime(request.query_params.get('issue_date'), '%Y-%m-%d').date()
            tickets = tickets.filter(issue_datetime__date=date_obj)
        except ValueError:
            return Response({'error': 'صيغة التاريخ غير صحيحة (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
    tickets = tickets.order_by('-id')
    paginator = StandardPagination()
    result_page = paginator.paginate_queryset(tickets, request)
    serializer = TicketSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def ticket_detail_api(request, ticket_id):
    """Retrieve details of a specific ticket."""
    ticket = get_object_or_404(Ticket, id=ticket_id, club=request.user.club)
    serializer = TicketSerializer(ticket)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_ticket_api(request):
    """Create a new ticket."""
    data = request.data.copy()
    data['issued_by'] = request.user.id
    data['club'] = request.user.club.id
    serializer = TicketSerializer(data=data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    try:
        with transaction.atomic():
            club = request.user.club
            ticket_type = serializer.validated_data['ticket_type']
            today = timezone.now().date()
            date_prefix = today.strftime('%Y%m%d')
            ticket_count = Ticket.objects.filter(club=club, ticket_type=ticket_type, issue_datetime__date=today).count()
            max_attempts = 999
            attempt = 0
            while attempt < max_attempts:
                serial_number = f"{date_prefix}-{str(ticket_count + 1).zfill(3)}"
                if not Ticket.objects.filter(serial_number=serial_number).exists():
                    break
                ticket_count += 1
                attempt += 1
            else:
                return Response({'error': 'تم الوصول إلى الحد الأقصى للتذاكر اليومية.'}, status=status.HTTP_400_BAD_REQUEST)
            ticket = serializer.save(serial_number=serial_number, price=ticket_type.price)
            if ticket.price > 0:
                source, _ = IncomeSource.objects.get_or_create(
                    club=ticket.club, name='تذاكر', defaults={'description': 'إيرادات بيع التذاكر', 'price': 0.00}
                )
                Income.objects.create(
                    club=ticket.club, source=source, amount=ticket.price,
                    description=f"بيع تذكرة {ticket.ticket_type.name} ({ticket.serial_number})",
                    date=today, received_by=request.user
                )
            return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_ticket_api(request, ticket_id):
    """Delete a ticket (Owner or Admin only)."""
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'غير مسموح بالحذف. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    ticket = get_object_or_404(Ticket, id=ticket_id, club=request.user.club)
    with transaction.atomic():
        ticket.delete()
        Income.objects.filter(club=ticket.club, description__contains=ticket.serial_number).delete()
    return Response({'message': 'تم حذف التذكرة بنجاح.'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_ticket_type_api(request):
    """Create a new ticket type."""
    data = request.data.copy()
    data['club'] = request.user.club.id
    serializer = TicketTypeSerializer(data=data, context={'request': request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    try:
        with transaction.atomic():
            ticket_type = serializer.save()
            return Response(TicketTypeSerializer(ticket_type).data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)