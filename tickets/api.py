from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Ticket
from .serializers import TicketSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub
from finance.models import Income, IncomeSource
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from members.models import Member
from django.db.models import Q
from django.db import transaction
from staff.models import StaffAttendance
from datetime import datetime

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def ticket_list_api(request):
    ticket_type = request.query_params.get('ticket_type')
    used = request.query_params.get('used')
    issue_date = request.query_params.get('issue_date')
    buyer_name = request.query_params.get('buyer_name')
    is_search_mode = bool(ticket_type or used is not None or issue_date or buyer_name)  # Consider it a search if any filter is provided

    if request.user.role in ['owner', 'admin']:
        tickets = Ticket.objects.select_related('club', 'used_by').filter(club=request.user.club)
    else:
        if is_search_mode:
            # Allow access to tickets issued by the user for search queries
            tickets = Ticket.objects.select_related('club', 'used_by').filter(
                club=request.user.club,
                issued_by=request.user  # Restrict to tickets issued by the user
            )
        else:
            # Restrict to tickets issued by the user in current shift
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True  # Current open shift
            ).order_by('-check_in').first()

            if not attendance:
                return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

            tickets = Ticket.objects.select_related('club', 'used_by').filter(
                club=request.user.club,
                issued_by=request.user,  # Restrict to tickets issued by the user
                issue_date__gte=attendance.check_in,
                issue_date__lte=timezone.now()
            )

    if ticket_type:
        tickets = tickets.filter(ticket_type=ticket_type)
    if used is not None:
        tickets = tickets.filter(used=used.lower() == 'true')
    if issue_date:
        try:
            date_obj = datetime.strptime(issue_date, '%Y-%m-%d').date()
            tickets = tickets.filter(issue_date=date_obj)
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
    if buyer_name:
        tickets = tickets.filter(buyer_name__icontains=buyer_name)

    tickets = tickets.order_by('-id')
    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(tickets, request)
    serializer = TicketSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def ticket_detail_api(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    ticket_type = request.query_params.get('ticket_type')
    used = request.query_params.get('used')
    issue_date = request.query_params.get('issue_date')
    buyer_name = request.query_params.get('buyer_name')
    is_search_mode = bool(ticket_type or used is not None or issue_date or buyer_name)  # Consider it a search if any filter is provided

    if request.user.role not in ['owner', 'admin'] and not is_search_mode:
        # Restrict to tickets issued by the user in current shift
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

        if ticket.issued_by != request.user or ticket.issue_date < attendance.check_in or ticket.issue_date > timezone.now():
            return Response({'error': 'This ticket is not associated with your current shift.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = TicketSerializer(ticket)
    return Response(serializer.data)

# باقي الـ APIs بدون تغيير
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

    serializer = TicketSerializer(data=request.data)
    
    if serializer.is_valid():
        club = serializer.validated_data.get('club')
        identifier = request.data.get('identifier')
        used_by = None
        if identifier:
            try:
                members = Member.objects.filter(
                    Q(club=club) & 
                    (
                        Q(rfid_code=identifier) |
                        Q(phone=identifier) |
                        Q(name__iexact=identifier)
                    )
                )
                if not members.exists():
                    return Response(
                        {'error': 'No member found with the provided identifier'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                if members.count() > 1:
                    return Response(
                        {'error': 'Multiple members found with the provided identifier. Please use a unique RFID or phone.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                used_by = members.first()
            except Exception as e:
                return Response(
                    {'error': f'Error processing identifier: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        with transaction.atomic():
            ticket = serializer.save()
            if used_by:
                ticket.used_by = used_by
                ticket.used = True
                ticket.save()

            if ticket.price > 0:
                source, _ = IncomeSource.objects.get_or_create(
                    club=ticket.club,
                    name='Ticket',
                    defaults={'description': 'ارباح بيع تذاكر'}
                )
                Income.objects.create(
                    club=ticket.club,
                    source=source,
                    amount=ticket.price,
                    description=f"بيع تذكره بنوع {ticket.ticket_type}",
                    date=timezone.now().date(),
                    received_by=request.user
                )

        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def edit_ticket_api(request, ticket_id):
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'Only owners or admins can edit tickets.'}, status=status.HTTP_403_FORBIDDEN)

    ticket = get_object_or_404(Ticket, id=ticket_id)
    identifier = request.data.get('identifier')
    used_by = None
    club = ticket.club

    if identifier:
        try:
            members = Member.objects.filter(
                Q(club=club) & 
                (
                    Q(rfid_code=identifier) |
                    Q(phone=identifier) |
                    Q(name__iexact=identifier)
                )
            )
            if not members.exists():
                return Response(
                    {'error': 'No member found with the provided identifier'},
                    status=status.HTTP_404_NOT_FOUND
                )
            if members.count() > 1:
                return Response(
                    {'error': 'Multiple members found with the provided identifier. Please use a unique RFID or phone.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            used_by = members.first()
        except Exception as e:
            return Response(
                {'error': f'Error processing identifier: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    serializer = TicketSerializer(ticket, data=request.data)
    if serializer.is_valid():
        if used_by:
            serializer.validated_data['used_by'] = used_by
        updated_ticket = serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_ticket_api(request, ticket_id):
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'Only owners or admins can delete tickets.'}, status=status.HTTP_403_FORBIDDEN)

    ticket = get_object_or_404(Ticket, id=ticket_id)
    ticket.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def mark_ticket_used_api(request, ticket_id):
    if request.user.role not in ['owner', 'admin']:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'You can only mark tickets as used during an active shift.'}, status=status.HTTP_403_FORBIDDEN)

    ticket = get_object_or_404(Ticket, id=ticket_id)
    if not IsOwnerOrRelatedToClub().has_object_permission(request, None, ticket):
        return Response(
            {'error': 'You do not have permission to mark this ticket as used'},
            status=status.HTTP_403_FORBIDDEN
        )
    identifier = request.data.get('identifier')
    
    if not identifier:
        return Response(
            {'error': 'Identifier (rfid, phone, or name) is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        members = Member.objects.filter(
            Q(club=ticket.club) & 
            (
                Q(rfid_code=identifier) |
                Q(phone=identifier) |
                Q(phone2=identifier) |
                Q(name__iexact=identifier)
            )
        )

        if not members.exists():
            return Response(
                {'error': 'No member found with the provided identifier'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if members.count() > 1:
            if members.filter(name__iexact=identifier).exists():
                return Response(
                    {'error': 'Multiple members found with the same name. Please use RFID or phone for precision.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'error': 'Multiple members found with the provided identifier'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        member = members.first()
        
        ticket.used = True
        ticket.used_by = member
        ticket.save()
        
        serializer = TicketSerializer(ticket)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': f'Error processing request: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )