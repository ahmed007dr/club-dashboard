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
from utils.permissions import IsOwnerOrRelatedToClub  #
from decimal import Decimal

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_type_list(request):
    if request.method == 'GET':
        types = SubscriptionType.objects.all() 
        serializer = SubscriptionTypeSerializer(types, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SubscriptionTypeSerializer(data=request.data)
        if serializer.is_valid():
            subscription_type = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
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
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def active_subscription_types(request):
    types = SubscriptionType.objects.filter(is_active=True)  
    serializer = SubscriptionTypeSerializer(types, many=True)
    return Response(serializer.data)

# Subscription Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_list(request):
    if request.method == 'GET':
        if request.user.role == 'owner':
            subscriptions = Subscription.objects.select_related('member', 'type', 'club').all() 
        else:
            subscriptions = Subscription.objects.select_related('member', 'type', 'club').filter(club=request.user.club)  

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

            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
                subscription.delete() 
                return Response({'error': 'You do not have permission to create a subscription for this club'}, status=status.HTTP_403_FORBIDDEN)
            # Auto-calculate remaining amount
            subscription.remaining_amount = subscription.type.price - subscription.paid_amount
            subscription.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_detail(request, pk):
    subscription = get_object_or_404(Subscription, pk=pk)
    
    if request.method == 'GET':
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = SubscriptionSerializer(subscription, data=request.data, partial=True)
        if serializer.is_valid():
            updated_subscription = serializer.save()
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, updated_subscription):
                return Response({'error': 'You do not have permission to update this subscription to this club'}, status=status.HTTP_403_FORBIDDEN)
            updated_subscription.remaining_amount = updated_subscription.type.price - updated_subscription.paid_amount
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
        )  
    else:
        subscriptions = Subscription.objects.filter(
            start_date__lte=today,
            end_date__gte=today,
            club=request.user.club
        ) 

    serializer = SubscriptionSerializer(subscriptions, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def expired_subscriptions(request):
    today = timezone.now().date()
    if request.user.role == 'owner':
        subscriptions = Subscription.objects.filter(
            end_date__lt=today
        )  
    else:
        subscriptions = Subscription.objects.filter(
            end_date__lt=today,
            club=request.user.club
        )  

    serializer = SubscriptionSerializer(subscriptions, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def upcoming_subscriptions(request):
    today = timezone.now().date()
    if request.user.role == 'owner':
        subscriptions = Subscription.objects.filter(
            start_date__gt=today
        ) 
    else:
        subscriptions = Subscription.objects.filter(
            start_date__gt=today,
            club=request.user.club
        )  

    serializer = SubscriptionSerializer(subscriptions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def renew_subscription(request, pk):
    subscription = get_object_or_404(Subscription, pk=pk)

    new_end_date = subscription.end_date + timedelta(
        days=subscription.type.duration_days
    )
    subscription.end_date = new_end_date
    subscription.save()
    serializer = SubscriptionSerializer(subscription)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
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
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def member_subscriptions(request):
    member_id = request.query_params.get('member_id')
    if not member_id:
        return Response(
            {"error": "member_id parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if request.user.role == 'owner':
        subscriptions = Subscription.objects.filter(member_id=member_id)  
    else:
        subscriptions = Subscription.objects.filter(
            member_id=member_id,
            club=request.user.club
        )  

    serializer = SubscriptionSerializer(subscriptions, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_stats(request):
    today = timezone.now().date()
    if request.user.role == 'owner':
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
    else:
        stats = {
            'total': Subscription.objects.filter(club=request.user.club).count(),
            'active': Subscription.objects.filter(
                start_date__lte=today,
                end_date__gte=today,
                club=request.user.club
            ).count(),
            'expired': Subscription.objects.filter(
                end_date__lt=today,
                club=request.user.club
            ).count(),
            'upcoming': Subscription.objects.filter(
                start_date__gt=today,
                club=request.user.club
            ).count(),
        }
    
    return Response(stats)