from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from .models import Subscription, SubscriptionType
from .serializers import SubscriptionSerializer, SubscriptionTypeSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub
from decimal import Decimal
from finance.models import Income, IncomeSource
from celery import shared_task

class SubscriptionPagination(PageNumberPagination):
    page_size = 100

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
@method_decorator(cache_page(60*15))
def subscription_type_list(request):
    if request.method == 'GET':
        if request.user.role == 'owner':
            types = SubscriptionType.objects.select_related('club').all()
        else:
            types = SubscriptionType.objects.select_related('club').filter(club=request.user.club)
        serializer = SubscriptionTypeSerializer(types, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SubscriptionTypeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            subscription_type = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_list(request):
    if request.method == 'GET':
        if request.user.role == 'owner':
            subscriptions = Subscription.objects.select_related('member', 'type', 'club')
        else:
            subscriptions = Subscription.objects.select_related('member', 'type', 'club').filter(club=request.user.club)

        member_id = request.query_params.get('member')
        type_id = request.query_params.get('type')
        club_id = request.query_params.get('club')
        
        if member_id:
            subscriptions = subscriptions.filter(member_id=member_id)
        if type_id:
            subscriptions = subscriptions.filter(type_id=type_id)
        if club_id:
            subscriptions = subscriptions.filter(club_id=club_id)
            
        paginator = SubscriptionPagination()
        result_page = paginator.paginate_queryset(subscriptions, request)
        serializer = SubscriptionSerializer(result_page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SubscriptionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            subscription = serializer.save()
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
                subscription.delete()
                return Response({'error': 'You do not have permission to create a subscription for this club'}, status=status.HTTP_403_FORBIDDEN)
            
            if subscription.paid_amount > 0:
                create_income_for_subscription.delay(subscription.id, request.user.id)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@shared_task
def create_income_for_subscription(subscription_id, user_id):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    subscription = Subscription.objects.get(id=subscription_id)
    user = User.objects.get(id=user_id)
    source, _ = IncomeSource.objects.get_or_create(
        club=subscription.club,
        name='Subscription',
        defaults={'description': 'ايراد عن اشتراك'}
    )
    Income.objects.create(
        club=subscription.club,
        source=source,
        amount=subscription.paid_amount,
        description=f"ايراد اشتراك عن اللاعب {subscription.member.name}",
        date=timezone.now().date(),
        received_by=user
    )

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
@method_decorator(cache_page(60*5))
def subscription_type_detail(request, pk):
    subscription_type = get_object_or_404(SubscriptionType.objects.select_related('club'), pk=pk)
    if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription_type):
        return Response({'error': 'You do not have permission to access this subscription type'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        serializer = SubscriptionTypeSerializer(subscription_type, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = SubscriptionTypeSerializer(subscription_type, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if Subscription.objects.filter(type=subscription_type).exists():
            return Response({'error': 'Cannot delete subscription type with active subscriptions'}, status=status.HTTP_400_BAD_REQUEST)
        subscription_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
@method_decorator(cache_page(60*15))
def active_subscription_types(request):
    if request.user.role == 'owner':
        types = SubscriptionType.objects.filter(is_active=True).select_related('club')
    else:
        types = SubscriptionType.objects.filter(is_active=True, club=request.user.club).select_related('club')
    serializer = SubscriptionTypeSerializer(types, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
@method_decorator(cache_page(60*5))
def subscription_detail(request, pk):
    subscription = get_object_or_404(Subscription.objects.select_related('member', 'type', 'club'), pk=pk)
    if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
        return Response({'error': 'You do not have permission to access this subscription'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        serializer = SubscriptionSerializer(subscription, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = SubscriptionSerializer(subscription, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated_subscription = serializer.save()
            updated_subscription.remaining_amount = updated_subscription.type.price - updated_subscription.paid_amount
            updated_subscription.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        subscription.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
@method_decorator(cache_page(60*15))
def active_subscriptions(request):
    today = timezone.now().date()
    if request.user.role == 'owner':
        subscriptions = Subscription.objects.filter(start_date__lte=today, end_date__gte=today).select_related('member', 'type', 'club')
    else:
        subscriptions = Subscription.objects.filter(start_date__lte=today, end_date__gte=today, club=request.user.club).select_related('member', 'type', 'club')
    paginator = SubscriptionPagination()
    result_page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(result_page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
@method_decorator(cache_page(60*15))
def expired_subscriptions(request):
    today = timezone.now().date()
    if request.user.role == 'owner':
        subscriptions = Subscription.objects.filter(end_date__lt=today).select_related('member', 'type', 'club')
    else:
        subscriptions = Subscription.objects.filter(end_date__lt=today, club=request.user.club).select_related('member', 'type', 'club')
    paginator = SubscriptionPagination()
    result_page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(result_page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
@method_decorator(cache_page(60*15))
def upcoming_subscriptions(request):
    today = timezone.now().date()
    if request.user.role == 'owner':
        subscriptions = Subscription.objects.filter(start_date__gt=today).select_related('member', 'type', 'club')
    else:
        subscriptions = Subscription.objects.filter(start_date__gt=today, club=request.user.club).select_related('member', 'type', 'club')
    paginator = SubscriptionPagination()
    result_page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(result_page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def renew_subscription(request, pk):
    subscription = get_object_or_404(Subscription.objects.select_related('member', 'type', 'club'), pk=pk)
    if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
        return Response({'error': 'You do not have permission to renew this subscription'}, status=status.HTTP_403_FORBIDDEN)

    renew_subscription_async.delay(subscription.id, request.user.id)
    serializer = SubscriptionSerializer(subscription, context={'request': request})
    return Response(serializer.data)

@shared_task
def renew_subscription_async(subscription_id, user_id):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    subscription = Subscription.objects.get(id=subscription_id)
    user = User.objects.get(id=user_id)
    new_end_date = subscription.end_date + timedelta(days=subscription.type.duration_days)
    subscription.end_date = new_end_date
    subscription.paid_amount = subscription.type.price
    subscription.remaining_amount = 0
    subscription.entry_count = 0
    subscription.save()

    source, _ = IncomeSource.objects.get_or_create(
        club=subscription.club,
        name='Renewal',
        defaults={'description': 'ايراد عن تجديد اشتراك'}
    )
    Income.objects.create(
        club=subscription.club,
        source=source,
        amount=subscription.type.price,
        description=f"تجديد اشتراك عن المشترك {subscription.member.name}",
        date=timezone.now().date(),
        received_by=user
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def make_payment(request, pk):
    subscription = get_object_or_404(Subscription.objects.select_related('member', 'type', 'club'), pk=pk)
    if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
        return Response({'error': 'You do not have permission to make a payment for this subscription'}, status=status.HTTP_403_FORBIDDEN)

    if subscription.remaining_amount <= 0:
        return Response({"error": "No remaining amount to pay"}, status=status.HTTP_400_BAD_REQUEST)

    amount = Decimal(request.data.get('amount', 0))
    if amount <= 0:
        return Response({"error": "Payment amount must be positive"}, status=status.HTTP_400_BAD_REQUEST)
    
    if amount > subscription.remaining_amount:
        return Response({"error": f"Payment amount cannot exceed {subscription.remaining_amount}"}, status=status.HTTP_400_BAD_REQUEST)
    
    make_payment_async.delay(subscription.id, amount, request.user.id)
    serializer = SubscriptionSerializer(subscription, context={'request': request})
    return Response(serializer.data)

@shared_task
def make_payment_async(subscription_id, amount, user_id):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    subscription = Subscription.objects.get(id=subscription_id)
    user = User.objects.get(id=user_id)
    subscription.paid_amount += Decimal(amount)
    subscription.remaining_amount = max(Decimal('0'), subscription.type.price - subscription.paid_amount)
    subscription.save()

    source, _ = IncomeSource.objects.get_or_create(
        club=subscription.club,
        name='Subscription',
        defaults={'description': 'ايراد عن اشتراك'}
    )
    Income.objects.create(
        club=subscription.club,
        source=source,
        amount=amount,
        description=f"ايراد عن اشتراك باسم {subscription.member.name}",
        date=timezone.now().date(),
        received_by=user
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
@method_decorator(cache_page(60*15))
def member_subscriptions(request):
    member_id = request.query_params.get('member_id')
    if not member_id:
        return Response({"error": "member_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    if request.user.role == 'owner':
        subscriptions = Subscription.objects.filter(member_id=member_id).select_related('member', 'type', 'club')
    else:
        subscriptions = Subscription.objects.filter(member_id=member_id, club=request.user.club).select_related('member', 'type', 'club')
    paginator = SubscriptionPagination()
    result_page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(result_page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
@method_decorator(cache_page(60*15))
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