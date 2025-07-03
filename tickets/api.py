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
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

FULL_ACCESS_ROLES = ['owner', 'admin']

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 20

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ticket_type_list_api(request):
    """List ticket types with optional name filter."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    ticket_types = TicketType.objects.filter(club=request.user.club, price__gt=0)
    if request.query_params.get('name'):
        ticket_types = ticket_types.filter(name__icontains=request.query_params.get('name'))
    ticket_types = ticket_types.order_by('-id')
    paginator = StandardPagination()
    result_page = paginator.paginate_queryset(ticket_types, request)
    serializer = TicketTypeSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ticket_list_api(request):
    """List tickets with optional filters."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
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
@permission_classes([IsAuthenticated])
def ticket_detail_api(request, ticket_id):
    """Retrieve details of a specific ticket."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    ticket = get_object_or_404(Ticket, id=ticket_id, club=request.user.club)
    serializer = TicketSerializer(ticket)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_ticket_api(request):
    """Create multiple tickets in a single request."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    data = request.data
    num_tickets = data.get('num_tickets', 1)
    if not isinstance(num_tickets, int) or num_tickets < 1:
        return Response({'error': 'عدد التذاكر يجب أن يكون عددًا صحيحًا موجبًا.'}, status=status.HTTP_400_BAD_REQUEST)

    ticket_data = {
        'ticket_type_id': data.get('ticket_type'),
        'notes': data.get('notes', ''),
        'issued_by': request.user.id,
        'club': request.user.club.id,
    }
    serializer = TicketSerializer(data=ticket_data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            club = request.user.club
            ticket_type = serializer.validated_data['ticket_type']
            today = timezone.now().date()
            date_prefix = today.strftime('%Y%m%d')

            # الحصول على عدد التذاكر الحالية مع قفل لتجنب التعارض
            ticket_count = Ticket.objects.filter(
                club=club, ticket_type=ticket_type, issue_datetime__date=today
            ).select_for_update().count()

            # تخصيص أرقام تسلسلية للتذاكر
            tickets_to_create = []
            serial_numbers = []
            current_count = ticket_count
            tickets_needed = num_tickets
            serial_index = current_count + 1

            while tickets_needed > 0:
                serial_number = f"{date_prefix}-{str(serial_index).zfill(4)}"
                # إذا كان الرقم التسلسلي موجودًا، جرب الرقم التالي
                while Ticket.objects.filter(serial_number=serial_number).exists():
                    serial_index += 1
                    serial_number = f"{date_prefix}-{str(serial_index).zfill(4)}"
                serial_numbers.append(serial_number)
                tickets_to_create.append(
                    Ticket(
                        club=club,
                        ticket_type=ticket_type,
                        notes=ticket_data['notes'],
                        price=ticket_type.price,
                        issue_datetime=timezone.now(),
                        issued_by=request.user,
                        serial_number=serial_number
                    )
                )
                tickets_needed -= 1
                serial_index += 1

            Ticket.objects.bulk_create(tickets_to_create)

            if ticket_type.price > 0:
                source, _ = IncomeSource.objects.get_or_create(
                    club=club, name='تذاكر', defaults={'description': 'إيرادات بيع التذاكر', 'price': 0.00}
                )
                total_amount = ticket_type.price * num_tickets
                Income.objects.create(
                    club=club,
                    source=source,
                    amount=total_amount,
                    description=f"بيع {num_tickets} تذكرة من نوع {ticket_type.name} (أرقام: {serial_numbers[0]} إلى {serial_numbers[-1]})",
                    date=today,
                    received_by=request.user
                )

            # استرجاع التذاكر التي تم إنشاؤها
            created_tickets = Ticket.objects.filter(serial_number__in=serial_numbers)
            response_serializer = TicketSerializer(created_tickets, many=True)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error creating tickets: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_ticket_api(request, ticket_id):
    """Delete a ticket (Owner or Admin only)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.user.role not in FULL_ACCESS_ROLES:
        return Response({'error': 'غير مسموح بالحذف. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    
    ticket = get_object_or_404(Ticket, id=ticket_id, club=request.user.club)
    with transaction.atomic():
        ticket.delete()
        Income.objects.filter(club=ticket.club, description__contains=ticket.serial_number).delete()
    return Response({'message': 'تم حذف التذكرة بنجاح.'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_ticket_type_api(request):
    """Create a new ticket type."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
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
        logger.error(f"Error creating ticket type: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)