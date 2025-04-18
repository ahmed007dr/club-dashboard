from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
from .models import Subscription, SubscriptionType
from .serializers import SubscriptionSerializer, SubscriptionTypeSerializer

class SubscriptionTypeViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing subscription types
    """
    queryset = SubscriptionType.objects.all()
    serializer_class = SubscriptionTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['includes_gym', 'includes_pool', 'includes_classes']

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get active subscription types (custom endpoint)
        """
        queryset = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing subscriptions
    """
    queryset = Subscription.objects.select_related(
        'member', 'type', 'club'
    ).all()
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'member': ['exact'],
        'type': ['exact'],
        'club': ['exact'],
        'start_date': ['gte', 'lte', 'exact'],
        'end_date': ['gte', 'lte', 'exact'],
        'paid_amount': ['gte', 'lte'],
    }

    def perform_create(self, serializer):
        """
        Auto-calculate remaining amount when creating subscription
        """
        subscription = serializer.save()
        subscription.remaining_amount = subscription.type.price - subscription.paid_amount
        subscription.save()

    def perform_update(self, serializer):
        """
        Auto-update remaining amount when updating subscription
        """
        subscription = serializer.save()
        subscription.remaining_amount = subscription.type.price - subscription.paid_amount
        subscription.save()

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get currently active subscriptions
        """
        today = timezone.now().date()
        queryset = self.get_queryset().filter(
            start_date__lte=today,
            end_date__gte=today
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expired(self, request):
        """
        Get expired subscriptions
        """
        today = timezone.now().date()
        queryset = self.get_queryset().filter(
            end_date__lt=today
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming subscriptions (not yet started)
        """
        today = timezone.now().date()
        queryset = self.get_queryset().filter(
            start_date__gt=today
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        """
        Renew an existing subscription
        """
        subscription = self.get_object()
        new_end_date = subscription.end_date + timedelta(
            days=subscription.type.duration_days
        )
        subscription.end_date = new_end_date
        subscription.save()
        serializer = self.get_serializer(subscription)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def make_payment(self, request, pk=None):
        """
        Record a payment for a subscription
        """
        subscription = self.get_object()
        amount = float(request.data.get('amount', 0))
        if amount <= 0:
            return Response(
                {"error": "Payment amount must be positive"},
                status=status.HTTP_400_BAD_REQUEST
            )
        subscription.paid_amount += amount
        subscription.remaining_amount = max(
            0, 
            subscription.type.price - subscription.paid_amount
        )
        subscription.save()
        serializer = self.get_serializer(subscription)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def member(self, request):
        """
        Get subscriptions for specific member (by member ID)
        """
        member_id = request.query_params.get('member_id')
        if not member_id:
            return Response(
                {"error": "member_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        queryset = self.get_queryset().filter(member_id=member_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get subscription statistics
        """
        today = timezone.now().date()
        stats = {
            'total': self.get_queryset().count(),
            'active': self.get_queryset().filter(
                start_date__lte=today,
                end_date__gte=today
            ).count(),
            'expired': self.get_queryset().filter(
                end_date__lt=today
            ).count(),
            'upcoming': self.get_queryset().filter(
                start_date__gt=today
            ).count(),
        }
        return Response(stats)