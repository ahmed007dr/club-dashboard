from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import Subscription, SubscriptionType
from .serializers import SubscriptionSerializer, FreezeRequest, SubscriptionTypeSerializer

from finance.models import Income, IncomeSource
from members.models import Member
from staff.models import StaffAttendance
from accounts.models import User

from utils.permissions import IsOwnerOrRelatedToClub

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_type_list(request):
    if request.method == 'GET':
        search_term = request.GET.get('q', '')
        status_filter = request.GET.get('status', 'all')
        duration = request.GET.get('duration', '')
        includes_gym = request.GET.get('includes_gym', '')
        includes_pool = request.GET.get('includes_pool', '')
        includes_classes = request.GET.get('includes_classes', '')

        types = SubscriptionType.objects.filter(club=request.user.club).annotate(
            active_subscriptions_count=Count(
                'subscription',
                filter=Q(subscription__end_date__gte=timezone.now().date())
            )
        )

        if search_term:
            types = types.filter(Q(name__icontains=search_term))

        if status_filter != 'all':
            is_active = status_filter == 'active'
            types = types.filter(is_active=is_active)

        if duration:
            try:
                types = types.filter(duration_days=int(duration))
            except ValueError:
                pass

        if includes_gym in ('yes', 'no'):
            types = types.filter(includes_gym=includes_gym == 'yes')

        if includes_pool in ('yes', 'no'):
            types = types.filter(includes_pool=includes_pool == 'yes')

        if includes_classes in ('yes', 'no'):
            types = types.filter(includes_classes=includes_classes == 'yes')

        types = types.order_by('-id')

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(types, request)
        serializer = SubscriptionTypeSerializer(page, many=True, context={'request': request})
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
    if request.method == 'GET':
        search_term = request.GET.get('identifier', '')

        subscriptions = Subscription.objects.select_related('member', 'type', 'club').filter(club=request.user.club)

        if request.user.role in ['reception', 'accountant']:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_in__lte=timezone.now(),
                check_out__gte=timezone.now()
            ).first()
            if attendance and attendance.shift:
                subscriptions = subscriptions.filter(
                    created_by=request.user,
                    created_at__gte=attendance.check_in,
                    created_at__lte=attendance.check_out if attendance.check_out else timezone.now()
                )
            else:
                subscriptions = subscriptions.none()

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

        filters = {}
        for param, field in filterable_fields.items():
            if param in request.query_params:
                filters[field] = request.query_params[param]

        range_filters = {}
        for param in request.query_params:
            if param.endswith('_gte') or param.endswith('_lte'):
                field_name = param.rsplit('__', 1)[0]
                if field_name in filterable_fields.values():
                    range_filters[param] = request.query_params[param]

        if search_term:
            subscriptions = subscriptions.filter(
                Q(member__name__icontains=search_term) |
                Q(member__phone__icontains=search_term) |
                Q(member__rfid_code__icontains=search_term)
            )

        try:
            subscriptions = subscriptions.filter(**filters)
        except ValueError as e:
            return Response({'error': f'Invalid filter value: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            subscriptions = subscriptions.filter(**range_filters)
        except ValueError as e:
            return Response({'error': f'Invalid range filter value: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        subscriptions = subscriptions.order_by('-id')

        status_filter = request.query_params.get('status', '').lower()
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

        if status_filter in status_filters:
            subscriptions = subscriptions.filter(**status_filters[status_filter])

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(subscriptions, request)
        serializer = SubscriptionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    elif request.method == 'POST':
        identifier = request.data.get('identifier', '')
        mutable_data = request.data.copy()
        mutable_data['created_by'] = request.user.id

        if identifier:
            try:
                member = Member.objects.filter(
                    Q(phone=identifier) | Q(rfid_code=identifier) | Q(name__iexact=identifier)
                ).first()
                if not member:
                    return Response({'error': 'لا يوجد عضو بهذا المعرف'}, status=status.HTTP_400_BAD_REQUEST)
                mutable_data['member'] = member.id
            except Member.DoesNotExist:
                return Response({'error': 'معرف غير صحيح'}, status=status.HTTP_400_BAD_REQUEST)

        if 'start_date' not in mutable_data or not mutable_data['start_date']:
            today = timezone.now().date()
            active_subscriptions = Subscription.objects.filter(
                member=mutable_data['member'],
                club=mutable_data['club'],
                start_date__lte=today,
                end_date__gte=today
            ).exclude(entry_count__gte=models.F('type__max_entries')).exclude(type__max_entries=0)
            
            if active_subscriptions.exists():
                latest_subscription = active_subscriptions.order_by('-end_date').first()
                if (latest_subscription.entry_count >= latest_subscription.type.max_entries and
                    latest_subscription.type.max_entries > 0):
                    mutable_data['start_date'] = today
                else:
                    mutable_data['start_date'] = latest_subscription.end_date + timedelta(days=1)
            else:
                mutable_data['start_date'] = today

        serializer = SubscriptionSerializer(data=mutable_data, context={'request': request})
        if serializer.is_valid():
            subscription = serializer.save()
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
                subscription.delete()
                return Response({'error': 'غير مخول لإنشاء اشتراك لهذا النادي'}, status=status.HTTP_403_FORBIDDEN)

            if subscription.paid_amount > 0:
                source, _ = IncomeSource.objects.get_or_create(
                    club=subscription.club, name='Subscription', defaults={'description': 'ايراد عن اشتراك'}
                )
                income = Income(
                    club=subscription.club, source=source, amount=subscription.paid_amount,
                    description=f"اشتراك {subscription.member.name}" + 
                                (f" مع الكابتن {subscription.coach.username} بسعر {subscription.private_training_price}" 
                                 if subscription.coach and subscription.type.is_private_training else ""),
                    date=timezone.now().date(), received_by=request.user
                )
                income.save()

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
                    Q(phone=identifier) | Q(rfid_code=identifier) | Q(name__iexact=identifier)
                ).first()
                if not member:
                    return Response({'error': 'لا يوجد عضو بهذا المعرف'}, status=status.HTTP_400_BAD_REQUEST)
                mutable_data['member'] = member.id
            except Member.DoesNotExist:
                return Response({'error': 'معرف غير صحيح'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubscriptionSerializer(subscription, data=mutable_data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated_subscription = serializer.save()

            if 'paid_amount' in mutable_data and updated_subscription.paid_amount > subscription.paid_amount:
                additional_amount = updated_subscription.paid_amount - subscription.paid_amount
                source, _ = IncomeSource.objects.get_or_create(
                    club=updated_subscription.club, name='Subscription', defaults={'description': 'ايراد عن اشتراك'}
                )
                income = Income(
                    club=updated_subscription.club, source=source, amount=additional_amount,
                    description=f"ايراد اضافي لاشتراك {updated_subscription.member.name}" +
                                (f" مع الكابتن {updated_subscription.coach.username} بسعر {updated_subscription.private_training_price}" 
                                 if updated_subscription.coach and updated_subscription.type.is_private_training else ""),
                    date=timezone.now().date(), received_by=request.user
                )
                income.save()

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        subscription.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def active_subscriptions(request):
    today = timezone.now().date()
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

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def request_freeze(request, pk):
    subscription = get_object_or_404(Subscription, pk=pk)
    
    # if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
    #     return Response({'error': 'You do not have permission to request a freeze for this subscription'}, status=status.HTTP_403_FORBIDDEN)

    requested_days = request.data.get('requested_days', 0)
    start_date_str = request.data.get('start_date', timezone.now().date())

    if isinstance(start_date_str, str):
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid start_date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        start_date = start_date_str

    if requested_days <= 0:
        return Response({'error': 'Requested freeze days must be positive'}, status=status.HTTP_400_BAD_REQUEST)
    
    if start_date < timezone.now().date():
        return Response({'error': 'Start date cannot be in the past'}, status=status.HTTP_400_BAD_REQUEST)
    
    if subscription.freeze_requests.filter(is_active=True).exists():
        return Response({'error': 'This subscription already has an active freeze'}, status=status.HTTP_400_BAD_REQUEST)

    total_freeze_days = sum(fr.requested_days for fr in subscription.freeze_requests.filter(is_active=False, cancelled_at__isnull=True))
    if total_freeze_days + requested_days > subscription.type.max_freeze_days:
        return Response({'error': f'Total freeze days ({total_freeze_days + requested_days}) exceeds maximum allowed ({subscription.type.max_freeze_days})'}, status=status.HTTP_400_BAD_REQUEST)

    freeze_request = FreezeRequest(
        subscription=subscription,
        requested_days=requested_days,
        start_date=start_date,
        is_active=True,
        created_by=request.user
    )
    freeze_request.save()

    serializer = SubscriptionSerializer(subscription)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def cancel_freeze(request, freeze_id):
    freeze_request = get_object_or_404(FreezeRequest, pk=freeze_id)
    
    if not IsOwnerOrRelatedToClub().has_object_permission(request, None, freeze_request):
        return Response({'error': 'You do not have permission to cancel this freeze request'}, status=status.HTTP_403_FORBIDDEN)

    if not freeze_request.is_active:
        return Response({'error': 'This freeze request is not active'}, status=status.HTTP_400_BAD_REQUEST)

    # Calculate used freeze days
    today = timezone.now().date()
    used_days = (today - freeze_request.start_date).days
    if used_days < 0:
        used_days = 0  # In case start_date is in the future
    elif used_days > freeze_request.requested_days:
        used_days = freeze_request.requested_days

    # Adjust subscription end_date
    subscription = freeze_request.subscription
    remaining_days = freeze_request.requested_days - used_days
    if remaining_days > 0:
        subscription.end_date -= timedelta(days=remaining_days)
        subscription.save()

    # Mark freeze as cancelled
    freeze_request.is_active = False
    freeze_request.cancelled_at = timezone.now()
    freeze_request.save()

    serializer = SubscriptionSerializer(subscription)
    return Response(serializer.data)


class CoachReportSerializer(serializers.Serializer):
    coach_id = serializers.IntegerField()
    coach_username = serializers.CharField()
    active_clients = serializers.IntegerField()
    total_private_training_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_paid_amount = serializers.DecimalField(max_digits=10, decimal_places=2)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def coach_report(request, coach_id):
    coach = get_object_or_404(User, pk=coach_id, role='coach', is_active=True)
    if coach.club != request.user.club and request.user.role != 'owner':
        return Response({'error': 'غير مخول لعرض تقرير هذا الكابتن'}, status=status.HTTP_403_FORBIDDEN)

    start_date = request.query_params.get('start_date', None)
    end_date = request.query_params.get('end_date', None)
    
    if start_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'صيغة تاريخ البداية غير صحيحة (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        start_date = timezone.now().date().replace(day=1)  # أول الشهر

    if end_date:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'صيغة تاريخ النهاية غير صحيحة (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        end_date = timezone.now().date()

    subscriptions = Subscription.objects.filter(
        coach=coach,
        club=request.user.club,
        type__is_private_training=True,
        start_date__lte=end_date,
        end_date__gte=start_date
    ).aggregate(
        active_clients=Count('id'),
        total_private_training_amount=Sum('private_training_price'),
        total_paid_amount=Sum('paid_amount')
    )

    report = {
        'coach_id': coach.id,
        'coach_username': coach.username,
        'active_clients': subscriptions['active_clients'] or 0,
        'total_private_training_amount': subscriptions['total_private_training_amount'] or 0,
        'total_paid_amount': subscriptions['total_paid_amount'] or 0
    }

    serializer = CoachReportSerializer(report)
    return Response(serializer.data)


