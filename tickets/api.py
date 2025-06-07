from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q,F
from django.db import models
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from .models import Ticket, TicketType, TicketBook
from .serializers import TicketSerializer, TicketTypeSerializer, TicketBookSerializer
from members.models import Member
from staff.models import StaffAttendance
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
    ticket_types = TicketType.objects.filter(club=request.user.club, price__gt=0)
    name = request.query_params.get('name')
    if name:
        ticket_types = ticket_types.filter(name__icontains=name)
    
    ticket_types = ticket_types.order_by('-id')
    paginator = StandardPagination()
    result_page = paginator.paginate_queryset(ticket_types, request)
    serializer = TicketTypeSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def ticket_list_api(request):
    ticket_type = request.query_params.get('ticket_type')
    issue_date = request.query_params.get('issue_date')
    notes = request.query_params.get('notes')
    is_search_mode = bool(ticket_type or issue_date or notes)

    if request.user.role in ['owner', 'admin']:
        tickets = Ticket.objects.select_related('club', 'ticket_type', 'issued_by').filter(club=request.user.club)
    else:
        if is_search_mode:
            tickets = Ticket.objects.select_related('club', 'ticket_type', 'issued_by').filter(
                club=request.user.club,
                issued_by=request.user
            )
        else:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True
            ).order_by('-check_in').first()

            if not attendance:
                return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

            tickets = Ticket.objects.select_related('club', 'ticket_type', 'issued_by').filter(
                club=request.user.club,
                issued_by=request.user,
                issue_datetime__gte=attendance.check_in,
                issue_datetime__lte=timezone.now()
            )

    if ticket_type:
        tickets = tickets.filter(ticket_type__id=ticket_type)
    if issue_date:
        try:
            date_obj = datetime.strptime(issue_date, '%Y-%m-%d').date()
            tickets = tickets.filter(issue_datetime__date=date_obj)
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
    if notes:
        tickets = tickets.filter(notes__icontains=notes)

    tickets = tickets.order_by('-id')
    paginator = StandardPagination()
    result_page = paginator.paginate_queryset(tickets, request)
    serializer = TicketSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def ticket_detail_api(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    is_search_mode = bool(
        request.query_params.get('ticket_type') or
        request.query_params.get('issue_date') or
        request.query_params.get('notes')
    )

    if request.user.role not in ['owner', 'admin'] and not is_search_mode:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

        if ticket.issued_by != request.user or ticket.issue_datetime < attendance.check_in or ticket.issue_datetime > timezone.now():
            return Response({'error': 'This ticket is not associated with your current shift.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = TicketSerializer(ticket)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_ticket_api(request):
    if request.user.role not in ['owner', 'admin']:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'You can only add tickets during an active shift.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data.copy()
    data['issued_by'] = request.user.id
    data['club'] = request.user.club.id

    serializer = TicketSerializer(data=data)
    
    if serializer.is_valid():
        club = serializer.validated_data.get('club')
        ticket_type = serializer.validated_data.get('ticket_type')

        with transaction.atomic():
            # Look for an open book with the same ticket_type
            book = TicketBook.objects.filter(
                club=club,
                ticket_type=ticket_type,
                total_tickets__gt=Ticket.objects.filter(book=models.F('id')).count()
            ).order_by('issued_date').first()

            if not book:
                return Response(
                    {'error': 'No open ticket book available for this ticket type. Please create a new ticket book.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if book.ticket_type != ticket_type:
                return Response({'error': 'Ticket type does not match the book type.'}, status=status.HTTP_400_BAD_REQUEST)

            ticket_count = Ticket.objects.filter(book=book).count()
            ticket_number = ticket_count + 1
            serial_number = f"{book.serial_prefix}-{str(ticket_number).zfill(3)}"

            ticket = serializer.save(
                serial_number=serial_number,
                book=book
            )

            if ticket.price > 0:
                try:
                    source = IncomeSource.objects.get(
                        club=ticket.club, name='تذاكر', price=0
                    )
                except IncomeSource.DoesNotExist:
                    source = IncomeSource.objects.create(
                        club=ticket.club,
                        name='تذاكر',
                        description='إيرادات بيع التذاكر',
                        price=0.00
                    )

                Income.objects.create(
                    club=ticket.club,
                    source=source,
                    amount=ticket.price,
                    description=f"بيع تذكرة {ticket.ticket_type.name} ({ticket.serial_number})",
                    date=timezone.now().date(),
                    received_by=request.user
                )

        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_ticket_api(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id, club=request.user.club)
    
    if request.user.role not in ['owner', 'admin']:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

        if ticket.issued_by != request.user or ticket.issue_datetime < attendance.check_in or ticket.issue_datetime > timezone.now():
            return Response({'error': 'This ticket is not associated with your current shift.'}, status=status.HTTP_403_FORBIDDEN)

    with transaction.atomic():
        ticket.delete()
        Income.objects.filter(
            club=ticket.club,
            description__contains=ticket.serial_number
        ).delete()

    return Response({'message': 'Ticket deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def ticket_book_report_api(request):
    club = request.user.club
    date = request.query_params.get('date')
    if date:
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        date_obj = timezone.now().date()

    books = TicketBook.objects.filter(club=club)
    report = []

    for book in books:
        tickets = Ticket.objects.filter(
            book=book,
            issue_datetime__date=date_obj
        ).order_by('serial_number')

        issued_count = tickets.count()
        serial_numbers = [ticket.serial_number for ticket in tickets]
        total_issued = Ticket.objects.filter(book=book).count()
        is_sequential = True

        if serial_numbers:
            first_number = int(serial_numbers[0].split('-')[-1])
            for i, serial in enumerate(serial_numbers):
                expected_number = first_number + i
                actual_number = int(serial.split('-')[-1])
                if actual_number != expected_number:
                    is_sequential = False
                    break

        report.append({
            'book_serial': book.serial_prefix,
            'total_tickets': book.total_tickets,
            'issued_tickets': issued_count,
            'total_issued_tickets': total_issued,
            'serial_numbers': serial_numbers,
            'is_sequential': is_sequential,
            'remaining_tickets': book.remaining_tickets(),
            'ticket_type': TicketTypeSerializer(book.ticket_type).data,  
        })

    return Response(report, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def create_ticket_book_api(request):
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'Only owners or admins can create ticket books.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data.copy()
    data['club'] = request.user.club.id

    serializer = TicketBookSerializer(data=data)
    if serializer.is_valid():
        club = request.user.club
        ticket_type = serializer.validated_data.get('ticket_type')

        # Check if there is an open book with the same ticket_type
        existing_book = TicketBook.objects.filter(
            club=club,
            ticket_type=ticket_type,
            total_tickets__gt=Ticket.objects.filter(book=models.F('id')).count()
        ).first()

        if existing_book:
            return Response(
                {'error': f'There is an open ticket book ({existing_book.serial_prefix}) with remaining tickets for this ticket type.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            book_count = TicketBook.objects.filter(club=club).count()
            serial_prefix = f"TBK-{str(book_count + 1).zfill(3)}"
            serializer.validated_data['serial_prefix'] = serial_prefix
            book = serializer.save()
        return Response(TicketBookSerializer(book).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
