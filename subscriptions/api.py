from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
from .models import Subscription, SubscriptionType
from .serializers import SubscriptionSerializer, SubscriptionTypeSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub
from decimal import Decimal
from finance.models import Income, IncomeSource
from rest_framework.pagination import PageNumberPagination
from members.models import Member

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_type_list(request):
    if request.method == 'GET':
        search_term = request.GET.get('q', '')

        if request.user.role == 'owner':
            types = SubscriptionType.objects.all().order_by('id')
        else:
            types = SubscriptionType.objects.filter(club=request.user.club)

        # Apply search filter
        if search_term:
            types = types.filter(
                Q(name__icontains=search_term)
            )

        types = types.order_by('id')
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(types, request)
        serializer = SubscriptionTypeSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SubscriptionTypeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            subscription_type = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_list(request):
    """
    Handle GET requests to retrieve a filtered list of subscriptions and POST requests to create a new subscription.
    """
    if request.method == 'GET':
        # Get the identifier from query parameters
        search_term = request.GET.get('identifier', '')

        if request.user.role == 'owner':
            subscriptions = Subscription.objects.select_related('member', 'type', 'club').all()
        else:
            subscriptions = Subscription.objects.select_related('member', 'type', 'club').filter(club=request.user.club)

        # Define filterable fields
        # Explanation: A dictionary maps query parameters to model fields, allowing dynamic filtering on fields like member_id, type_id, etc.
        filterable_fields = {
            'member_id': 'member_id',
            'type_id': 'type_id',
            'club_id': 'club_id',
            'club_name': 'club__name__iexact',  
            'start_date': 'start_date',
            'end_date': 'end_date',
            'paid_amount': 'paid_amount',
            'remaining_amount': 'remaining_amount',
            'entry_count': 'entry_count',
        }

        # Build filter dictionary from query parameters
        # Explanation: Collects exact-match filters (e.g., member_id=123) from query parameters.
        filters = {}
        for param, field in filterable_fields.items():
            if param in request.query_params:
                filters[field] = request.query_params[param]

        # Handle range filters (e.g., start_date_gte, paid_amount_lte)
        # Explanation: Collects range filters (e.g., start_date__gte=2023-01-01) for flexible querying.
        range_filters = {}
        for param in request.query_params:
            if param.endswith('_gte') or param.endswith('_lte'):
                field_name = param.rsplit('__', 1)[0]
                if field_name in filterable_fields.values():
                    range_filters[param] = request.query_params[param]

        # Apply search term filter
        # Explanation: Allows searching by member name, phone, or RFID code using a case-insensitive search.
        search_term = request.query_params.get('search_term', '')
        if search_term:
            subscriptions = subscriptions.filter(
                Q(member__name__icontains=search_term) |
                Q(member__phone__icontains=search_term) |
                Q(member__rfid_code__icontains=search_term)
            )

        # Apply exact filters
        # Explanation: Applies exact-match filters and handles invalid values by returning a 400 error.
        try:
            subscriptions = subscriptions.filter(**filters)
        except ValueError as e:
            return Response({'error': f'Invalid filter value: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Apply range filters
        # Explanation: Applies range filters and handles invalid values similarly.
        try:
            subscriptions = subscriptions.filter(**range_filters)
        except ValueError as e:
            return Response({'error': f'Invalid range filter value: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Order by start_date (descending)
        # Explanation: Sorts subscriptions by start_date in descending order (newest first).
        subscriptions = subscriptions.order_by('-start_date')

        # Handle status filter
        status = request.query_params.get('status', '').lower()
        today = timezone.now().date()
        
        status_filters = {
            'active': {
                'start_date__lte': today,
                'end_date__gte': today
            },
            'expired': {
                'end_date__lt': today
            },
            'upcoming': {
                'start_date__gt': today
            }
        }
        
        if status in status_filters:
            subscriptions = subscriptions.filter(**status_filters[status])

        # Paginate results
        # Explanation: Uses Django REST Framework's pagination to split results into pages.
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(subscriptions, request)
        serializer = SubscriptionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    elif request.method == 'POST':
        # Explanation: Handles creation of a new subscription. Accepts an 'identifier' (name, phone, or RFID) to find the member.
        identifier = request.data.get('identifier', '')

        if identifier:
            try:
                member = Member.objects.filter(
                    Q(phone=identifier) |
                    Q(rfid_code=identifier) |
                    Q(name__iexact=identifier)
                ).first()
                if not member:
                    return Response(
                        {'error': 'No member found with the provided identifier'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                mutable_data = request.data.copy()
                mutable_data['member'] = member.id
            except Member.DoesNotExist:
                return Response(
                    {'error': 'Invalid identifier provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            mutable_data = request.data

        # Explanation: Validates and saves the subscription using the serializer.
        serializer = SubscriptionSerializer(data=mutable_data, context={'request': request})
        if serializer.is_valid():
            subscription = serializer.save()
            
            # Explanation: Ensures the user has permission to create a subscription for the club.
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
                subscription.delete()
                return Response(
                    {'error': 'You do not have permission to create a subscription for this club'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Explanation: If there's a paid amount, create an Income record for the club.
            if subscription.paid_amount > 0:
                source, created = IncomeSource.objects.get_or_create(
                    club=subscription.club,
                    name='Subscription',
                    defaults={'description': 'ايراد عن اشتراك'}
                )
                income = Income(
                    club=subscription.club,
                    source=source,
                    amount=subscription.paid_amount,
                    description=f"ايراد اشتراك عن اللاعب {subscription.member.name}",
                    date=timezone.now().date(),
                    received_by=request.user
                )
                income.save()

            # Explanation: Calculate and save the remaining amount (type price - paid amount).
            subscription.remaining_amount = subscription.type.price - subscription.paid_amount
            subscription.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_type_detail(request, pk):
    subscription_type = get_object_or_404(SubscriptionType, pk=pk)
    
    if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription_type):
        return Response({'error': 'You do not have permission to access this subscription type'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        serializer = SubscriptionTypeSerializer(subscription_type)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = SubscriptionTypeSerializer(subscription_type, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if Subscription.objects.filter(type=subscription_type).exists():
            return Response(
                {'error': 'Cannot delete subscription type with active subscriptions'},
                status=status.HTTP_400_BAD_REQUEST
            )
        subscription_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def active_subscription_types(request):
    if request.user.role == 'owner':
        types = SubscriptionType.objects.filter(is_active=True).order_by('id')
    else:
        types = SubscriptionType.objects.filter(is_active=True, club=request.user.club).order_by('id')
    
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(types, request)
    serializer = SubscriptionTypeSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_detail(request, pk):
    subscription = get_object_or_404(Subscription, pk=pk)
    
    if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
        return Response({'error': 'You do not have permission to access this subscription'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        identifier = request.GET.get('identifier', '')  
        mutable_data = request.data.copy()  

        if identifier:
            try:
                member = Member.objects.filter(
                    Q(phone=identifier) |
                    Q(rfid_code=identifier) |
                    Q(name__iexact=identifier)
                ).first()
                if not member:
                    return Response(
                        {'error': 'No member found with the provided identifier'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                mutable_data['member'] = member.id  
            except Member.DoesNotExist:
                return Response(
                    {'error': 'Invalid identifier provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Update the subscription
        serializer = SubscriptionSerializer(subscription, data=mutable_data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated_subscription = serializer.save()
            
            # Recalculate remaining_amount
            updated_subscription.remaining_amount = updated_subscription.type.price - updated_subscription.paid_amount
            
            # Create Income record if paid_amount is updated
            if 'paid_amount' in mutable_data and updated_subscription.paid_amount > subscription.paid_amount:
                additional_amount = updated_subscription.paid_amount - subscription.paid_amount
                source, created = IncomeSource.objects.get_or_create(
                    club=updated_subscription.club,
                    name='Subscription',
                    defaults={'description': 'ايراد عن اشتراك'}
                )
                income = Income(
                    club=updated_subscription.club,
                    source=source,
                    amount=additional_amount,
                    description=f"ايراد اضافي عن اشتراك اللاعب {updated_subscription.member.name}",
                    date=timezone.now().date(),
                    received_by=request.user
                )
                income.save()

            updated_subscription.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        subscription.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def active_subscriptions(request):
    today = timezone.now().date()
    if request.user.role == 'owner':
        subscriptions = Subscription.objects.filter(
            start_date__lte=today,
            end_date__gte=today
        ).order_by('-start_date')
    else:
        subscriptions = Subscription.objects.filter(
            start_date__lte=today,
            end_date__gte=today,
            club=request.user.club
        ).order_by('-start_date')
    
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def expired_subscriptions(request):
    today = timezone.now().date()
    if request.user.role == 'owner':
        subscriptions = Subscription.objects.filter(end_date__lt=today).order_by('-end_date')
    else:
        subscriptions = Subscription.objects.filter(end_date__lt=today, club=request.user.club).order_by('-end_date')
    
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def upcoming_subscriptions(request):
    today = timezone.now().date()
    if request.user.role == 'owner':
        subscriptions = Subscription.objects.filter(start_date__gt=today).order_by('start_date')
    else:
        subscriptions = Subscription.objects.filter(start_date__gt=today, club=request.user.club).order_by('start_date')
    
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def renew_subscription(request, pk):
    subscription = get_object_or_404(Subscription, pk=pk)
    
    if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
        return Response({'error': 'You do not have permission to renew this subscription'}, status=status.HTTP_403_FORBIDDEN)

    new_end_date = subscription.end_date + timedelta(days=subscription.type.duration_days)
    subscription.end_date = new_end_date
    subscription.paid_amount = subscription.type.price
    subscription.remaining_amount = 0
    subscription.entry_count = 0  # Reset entry count on renewal
    subscription.save()

    source, created = IncomeSource.objects.get_or_create(
        club=subscription.club,
        name='Renewal',
        defaults={'description': 'ايراد عن تجديد اشتراك'}
    )
    income = Income(
        club=subscription.club,
        source=source,
        amount=subscription.type.price,
        description=f"تجديد اشتراك عن المشترك  {subscription.member.name}",
        date=timezone.now().date(),
        received_by=request.user
    )
    income.save()

    serializer = SubscriptionSerializer(subscription)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def make_payment(request, pk):
    subscription = get_object_or_404(Subscription, pk=pk)
    
    if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
        return Response({'error': 'You do not have permission to make a payment for this subscription'}, status=status.HTTP_403_FORBIDDEN)

    if subscription.remaining_amount <= 0:
        return Response({"error": "No remaining amount to pay for this subscription"}, status=status.HTTP_400_BAD_REQUEST)

    amount = Decimal(request.data.get('amount', 0))
    if amount <= 0:
        return Response({"error": "Payment amount must be positive"}, status=status.HTTP_400_BAD_REQUEST)
    
    if amount > subscription.remaining_amount:
        return Response({"error": f"Payment amount cannot exceed the remaining amount of {subscription.remaining_amount}"}, status=status.HTTP_400_BAD_REQUEST)
    
    subscription.paid_amount += amount
    subscription.remaining_amount = max(Decimal('0'), subscription.type.price - subscription.paid_amount)
    subscription.save()

    source, created = IncomeSource.objects.get_or_create(
        club=subscription.club,
        name='Subscription',
        defaults={'description': 'ايراد عن اشتراك'}
    )
    income = Income(
        club=subscription.club,
        source=source,
        amount=amount,
        description=f"ايراد عن اشتراك باسم {subscription.member.name}",
        date=timezone.now().date(),
        received_by=request.user
    )
    income.save()

    serializer = SubscriptionSerializer(subscription)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def member_subscriptions(request):
    member_id = request.query_params.get('member_id')
    search_term = request.query_params.get('identifier', '')

    if not member_id:
        return Response({"error": "member_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    if request.user.role == 'owner':
        subscriptions = Subscription.objects.select_related('member', 'type', 'club').filter(member_id=member_id)
    else:
        subscriptions = Subscription.objects.select_related('member', 'type', 'club').filter(member_id=member_id, club=request.user.club)
    
    if search_term:
        subscriptions = subscriptions.filter(
            Q(member__name__icontains=search_term) |
            Q(member__phone__icontains=search_term) |
            Q(member__rfid_code__icontains=search_term)
        )
    
    subscriptions = subscriptions.order_by('-start_date')
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_stats(request):
    today = timezone.now().date()
    if request.user.role == 'owner':
        stats = {
            'total': Subscription.objects.count(),
            'active': Subscription.objects.filter(start_date__lte=today, end_date__gte=today).count(),
            'expired': Subscription.objects.filter(end_date__lt=today).count(),
            'upcoming': Subscription.objects.filter(start_date__gt=today).count(),
        }
    else:
        stats = {
            'total': Subscription.objects.filter(club=request.user.club).count(),
            'active': Subscription.objects.filter(start_date__lte=today, end_date__gte=today, club=request.user.club).count(),
            'expired': Subscription.objects.filter(end_date__lt=today, club=request.user.club).count(),
            'upcoming': Subscription.objects.filter(start_date__gt=today, club=request.user.club).count(),
        }
    return Response(stats)