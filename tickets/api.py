from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
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
    is_search_mode = bool(ticket_type or issue_date)

    if request.user.role in ['owner', 'admin']:
        tickets = Ticket.objects.select_related('club', 'ticket_type', 'issued_by').filter(club=request.user.club)
    else:
        if is_search_mode:
            tickets = Ticket.objects.select_related('club', 'ticket_type', 'issued_by').filter(
                club=request.user.club,
                issued_by=request.user
            )
        else:
            from staff.models import StaffAttendance
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
        request.query_params.get('issue_date')
    )

    if request.user.role not in ['owner', 'admin'] and not is_search_mode:
        from staff.models import StaffAttendance
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
    # التحقق من نوبة العمل للموظفين
    if request.user.role not in ['owner', 'admin']:
        from staff.models import StaffAttendance
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if not attendance:
            return Response(
                {'error': 'You can only add tickets during an active shift.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

    # إعداد البيانات الأساسية
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

            ticket_count = Ticket.objects.filter(
                club=club,
                ticket_type=ticket_type,
                issue_datetime__date=today
            ).count()

            if ticket_count >= 100:
                ticket_count = 0  

            serial_number = f"{date_prefix}-{str(ticket_count + 1).zfill(3)}"  # مثل 20250607-001

            # التحقق من عدم تكرار serial_number
            if Ticket.objects.filter(serial_number=serial_number).exists():
                return Response(
                    {'error': f'Serial number {serial_number} already exists.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # حفظ التذكرة
            ticket = serializer.save(
                serial_number=serial_number,
                price=ticket_type.price
            )

            # تسجيل الإيراد إذا كان السعر أكبر من الصفر
            if ticket.price > 0:
                source, _ = IncomeSource.objects.get_or_create(
                    club=ticket.club,
                    name='تذاكر',
                    defaults={
                        'description': 'إيرادات بيع التذاكر',
                        'price': 0.00
                    }
                )

                Income.objects.create(
                    club=ticket.club,
                    source=source,
                    amount=ticket.price,
                    description=f"بيع تذكرة {ticket.ticket_type.name} ({ticket.serial_number})",
                    date=today,
                    received_by=request.user
                )

            return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_ticket_api(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id, club=request.user.club)
    
    if request.user.role not in ['owner', 'admin']:
        from staff.models import StaffAttendance
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


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_ticket_type_api(request):
    # Check if user is associated with a club
    if not request.user.club:
        return Response(
            {'error': 'User is not associated with any club.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Prepare data
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
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )