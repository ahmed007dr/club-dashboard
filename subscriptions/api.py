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

# Subscription Type Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def subscription_type_list(request):
    if request.method == 'GET':
        types = SubscriptionType.objects.all()
        serializer = SubscriptionTypeSerializer(types, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SubscriptionTypeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def subscription_type_detail(request, pk):
    subscription_type = get_object_or_404(SubscriptionType, pk=pk)
    
    if request.method == 'GET':
        serializer = SubscriptionTypeSerializer(subscription_type)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = SubscriptionTypeSerializer(subscription_type, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        subscription_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_subscription_types(request):
    types = SubscriptionType.objects.filter(is_active=True)
    serializer = SubscriptionTypeSerializer(types, many=True)
    return Response(serializer.data)

# Subscription Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def subscription_list(request):
    if request.method == 'GET':
        subscriptions = Subscription.objects.select_related('member', 'type', 'club').all()
        
        # Apply filters
        member_id = request.query_params.get('member')
        type_id = request.query_params.get('type')
        club_id = request.query_params.get('club')
        
        if member_id:
            subscriptions = subscriptions.filter(member_id=member_id)
        if type_id:
            subscriptions = subscriptions.filter(type_id=type_id)
        if club_id:
            subscriptions = subscriptions.filter(club_id=club_id)
            
        serializer = SubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SubscriptionSerializer(data=request.data)
        if serializer.is_valid():
            subscription = serializer.save()
            # Auto-calculate remaining amount
            subscription.remaining_amount = subscription.type.price - subscription.paid_amount
            subscription.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def subscription_detail(request, pk):
    subscription = get_object_or_404(Subscription, pk=pk)
    
    if request.method == 'GET':
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = SubscriptionSerializer(subscription, data=request.data, partial=True)
        if serializer.is_valid():
            subscription = serializer.save()
            # Auto-update remaining amount
            subscription.remaining_amount = subscription.type.price - subscription.paid_amount
            subscription.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        subscription.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_subscriptions(request):
    today = timezone.now().date()
    subscriptions = Subscription.objects.filter(
        start_date__lte=today,
        end_date__gte=today
    )
    serializer = SubscriptionSerializer(subscriptions, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expired_subscriptions(request):
    today = timezone.now().date()
    subscriptions = Subscription.objects.filter(
        end_date__lt=today
    )
    serializer = SubscriptionSerializer(subscriptions, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upcoming_subscriptions(request):
    today = timezone.now().date()
    subscriptions = Subscription.objects.filter(
        start_date__gt=today
    )
    serializer = SubscriptionSerializer(subscriptions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def renew_subscription(request, pk):
    subscription = get_object_or_404(Subscription, pk=pk)
    new_end_date = subscription.end_date + timedelta(
        days=subscription.type.duration_days
    )
    subscription.end_date = new_end_date
    subscription.save()
    serializer = SubscriptionSerializer(subscription)
    return Response(serializer.data)

from decimal import Decimal

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def make_payment(request, pk):
    subscription = get_object_or_404(Subscription, pk=pk)
    amount = Decimal(request.data.get('amount', 0))
    
    if amount <= 0:
        return Response(
            {"error": "Payment amount must be positive"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    subscription.paid_amount += amount
    subscription.remaining_amount = max(
        Decimal('0'), 
        subscription.type.price - subscription.paid_amount
    )
    subscription.save()
    serializer = SubscriptionSerializer(subscription)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def member_subscriptions(request):
    member_id = request.query_params.get('member_id')
    if not member_id:
        return Response(
            {"error": "member_id parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    subscriptions = Subscription.objects.filter(member_id=member_id)
    serializer = SubscriptionSerializer(subscriptions, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_stats(request):
    today = timezone.now().date()
    stats = {
        'total': Subscription.objects.count(),
        'active': Subscription.objects.filter(
            start_date__lte=today,
            end_date__gte=today
        ).count(),
        'expired': Subscription.objects.filter(
            end_date__lt=today
        ).count(),
        'upcoming': Subscription.objects.filter(
            start_date__gt=today
        ).count(),
    }
    return Response(stats)