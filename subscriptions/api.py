from datetime import datetime, timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import (
    Count, Sum, Avg, Q, Case, When, F, Max, IntegerField, FloatField, Value, ExpressionWrapper
)
from django.db.models.functions import TruncMonth, TruncWeek
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from subscriptions.models import Subscription, SubscriptionType, FreezeRequest
from subscriptions.serializers import (
    SubscriptionSerializer, SubscriptionTypeSerializer, CoachReportSerializer,MemberBehaviorSerializer
)

from finance.models import Income, IncomeSource
from members.models import Member
from staff.models import StaffAttendance
from accounts.models import User
from attendance.models import Attendance

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
                'subscriptions', 
                filter=Q(subscriptions__end_date__gte=timezone.now().date())            )
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
        search_term = request.GET.get('searchTerm', '') 
        is_search_mode = (
            search_term or
            any(param in request.query_params for param in [
                'member_id', 'type_id', 'club_id', 'club_name', 'start_date', 'end_date',
                'paid_amount', 'remaining_amount', 'entry_count', 'status'
            ]) or
            any(param.endswith('_gte') or param.endswith('_lte') for param in request.query_params)
        )

        # Base queryset for subscriptions
        subscriptions = Subscription.objects.select_related('member', 'type', 'club').filter(
            club=request.user.club
        )

        # Restrict non-admin users to their shift unless it's a search query
        if request.user.role in ['reception', 'accountant'] and not is_search_mode:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True  # Current open shift
            ).order_by('-check_in').first()
            if not attendance:
                return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)
            subscriptions = subscriptions.filter(
                created_by=request.user,
                created_at__gte=attendance.check_in,
                created_at__lte=timezone.now()
            )

        # Apply filters
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

        # Apply status filter
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

        # Pagination
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
        return Response({'error': 'غير مخول للوصول إلى نوع الاشتراك هذا'}, status=status.HTTP_403_FORBIDDEN)

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
                {'error': 'لا يمكن حذف نوع اشتراك مرتبط باشتراكات نشطة'},
                status=status.HTTP_400_BAD_REQUEST
            )
        subscription_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def active_subscription_types(request):
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
        return Response({'error': 'غير مخول للوصول إلى هذا الاشتراك'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        if request.user.role in ['reception', 'accountant']:
            identifier = request.GET.get('identifier', '')
            is_search_mode = bool(identifier)  # Consider it a search if identifier is provided
            if not is_search_mode:
                # Restrict to subscriptions created during current shift
                attendance = StaffAttendance.objects.filter(
                    staff=request.user,
                    club=request.user.club,
                    check_out__isnull=True
                ).order_by('-check_in').first()
                if not attendance or subscription.created_by != request.user or \
                   subscription.created_at < attendance.check_in or subscription.created_at > timezone.now():
                    return Response({'error': 'You can only view your own subscriptions within your shift'}, status=status.HTTP_403_FORBIDDEN)
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

        with transaction.atomic():
            type_id = mutable_data.get('type')
            if type_id:
                subscription_type = get_object_or_404(SubscriptionType, pk=type_id, club=request.user.club)
                type_data = {
                    'max_freeze_days': mutable_data.get('max_freeze_days', subscription_type.max_freeze_days),
                    'is_private_training': mutable_data.get('is_private_training', subscription_type.is_private_training)
                }
                type_serializer = SubscriptionTypeSerializer(
                    subscription_type, 
                    data=type_data, 
                    partial=True, 
                    context={'request': request}
                )
                if type_serializer.is_valid():
                    type_serializer.save()
                else:
                    return Response(type_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            serializer = SubscriptionSerializer(subscription, data=mutable_data, partial=True, context={'request': request})
            if serializer.is_valid():
                updated_subscription = serializer.save()
                if 'paid_amount' in mutable_data or 'private_training_price' in mutable_data:
                    old_paid_amount = subscription.paid_amount
                    old_private_training_price = subscription.private_training_price or Decimal('0')
                    new_paid_amount = updated_subscription.paid_amount
                    new_private_training_price = updated_subscription.private_training_price or Decimal('0')
                    additional_amount = (new_paid_amount - old_paid_amount) + (new_private_training_price - old_private_training_price)
                    if additional_amount > 0:
                        source, _ = IncomeSource.objects.get_or_create(
                            club=updated_subscription.club, 
                            name='Subscription', 
                            defaults={'description': 'ايراد عن اشتراك'}
                        )
                        income = Income(
                            club=updated_subscription.club,
                            source=source,
                            amount=additional_amount,
                            description=f"ايراد اضافي لاشتراك {updated_subscription.member.name}" +
                                        (f" مع الكابتن {updated_subscription.coach.username} بسعر {updated_subscription.private_training_price}" 
                                         if updated_subscription.coach and updated_subscription.type.is_private_training else ""),
                            date=timezone.now().date(),
                            received_by=request.user
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
    )

    if request.user.role in ['reception', 'accountant']:
        is_search_mode = bool(request.query_params)  # Any query params indicate a search
        if not is_search_mode:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True
            ).order_by('-check_in').first()
            if not attendance:
                return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)
            subscriptions = subscriptions.filter(
                created_by=request.user,
                created_at__gte=attendance.check_in,
                created_at__lte=timezone.now()
            )

    subscriptions = subscriptions.order_by('-start_date')
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def expired_subscriptions(request):
    today = timezone.now().date()
    subscriptions = Subscription.objects.filter(
        end_date__lt=today,
        club=request.user.club
    )

    if request.user.role in ['reception', 'accountant']:
        is_search_mode = bool(request.query_params)  # Any query params indicate a search
        if not is_search_mode:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True
            ).order_by('-check_in').first()
            if not attendance:
                return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)
            subscriptions = subscriptions.filter(
                created_by=request.user,
                created_at__gte=attendance.check_in,
                created_at__lte=timezone.now()
            )

    subscriptions = subscriptions.order_by('-end_date')
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def upcoming_subscriptions(request):
    today = timezone.now().date()
    subscriptions = Subscription.objects.filter(
        start_date__gt=today,
        club=request.user.club
    )

    if request.user.role in ['reception', 'accountant']:
        is_search_mode = bool(request.query_params)  # Any query params indicate a search
        if not is_search_mode:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True
            ).order_by('-check_in').first()
            if not attendance:
                return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)
            subscriptions = subscriptions.filter(
                created_by=request.user,
                created_at__gte=attendance.check_in,
                created_at__lte=timezone.now()
            )

    subscriptions = subscriptions.order_by('start_date')
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
    
    subscriptions = Subscription.objects.select_related('member', 'type', 'club').filter(
        member_id=member_id,
        club=request.user.club
    )

    if request.user.role in ['reception', 'accountant']:
        is_search_mode = bool(search_term or request.query_params.get('member_id'))
        if not is_search_mode:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True
            ).order_by('-check_in').first()
            if not attendance:
                return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)
            subscriptions = subscriptions.filter(
                created_by=request.user,
                created_at__gte=attendance.check_in,
                created_at__lte=timezone.now()
            )

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


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def coach_report(request, coach_id):
    coach = get_object_or_404(User, pk=coach_id, role='coach', is_active=True)
    if coach.club != request.user.club and request.user.role != 'owner':
        return Response({'error': 'غير مخول لعرض تقرير هذا الكابتن'}, status=status.HTTP_403_FORBIDDEN)

    # Handle date range
    start_date = request.query_params.get('start_date', None)
    end_date = request.query_params.get('end_date', None)
    
    if start_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'صيغة تاريخ البداية غير صحيحة (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        start_date = timezone.now().date().replace(day=1)  # First of the month

    if end_date:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'صيغة تاريخ النهاية غير صحيحة (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        end_date = timezone.now().date()

    # Get all subscriptions for the specified period
    subscriptions = Subscription.objects.filter(
        coach=coach,
        club=request.user.club,
        type__is_private_training=True,
        start_date__lte=end_date,
        end_date__gte=start_date
    ).select_related('member', 'type')

    # Calculate previous month's clients
    prev_month_end = start_date - timedelta(days=1)
    prev_month_start = prev_month_end.replace(day=1)
    prev_month_clients = Subscription.objects.filter(
        coach=coach,
        club=request.user.club,
        type__is_private_training=True,
        start_date__lte=prev_month_end,
        end_date__gte=prev_month_start
    ).aggregate(
        prev_clients=Count('id')
    )['prev_clients'] or 0

    # Aggregate data
    aggregated_data = subscriptions.aggregate(
        active_clients=Count('id'),
        total_private_training_amount=Sum('private_training_price'),
        total_paid_amount=Sum('paid_amount')
    )

    # Prepare report
    report = {
        'coach_id': coach.id,
        'coach_username': coach.username,
        'active_clients': aggregated_data['active_clients'] or 0,
        'total_private_training_amount': aggregated_data['total_private_training_amount'] or 0,
        'total_paid_amount': aggregated_data['total_paid_amount'] or 0,
        'previous_month_clients': prev_month_clients,
        'subscriptions': subscriptions,
        'start_date': start_date,
        'end_date': end_date
    }

    serializer = CoachReportSerializer(report)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_analytics(request):
    """
    API endpoint to retrieve analytics for subscriptions, including popular types, attendance,
    freeze stats, revenue, member behavior, coach performance, and more.
    """
    # Initialize parameters
    today = timezone.now().date()
    club = request.user.club

    # Get query parameters
    start = request.query_params.get('start_date')
    end = request.query_params.get('end_date')
    s_type = request.query_params.get('subscription_type')
    coach = request.query_params.get('coach')

    # Validate and parse dates
    try:
        start_date = datetime.strptime(start, '%Y-%m-%d').date() if start else today - timedelta(days=90)
        end_date = datetime.strptime(end, '%Y-%m-%d').date() if end else today
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Define base filter for Subscription model
    base_filter = {
        'club': club,
        'start_date__lte': end_date,
        'end_date__gte': start_date
    }
    if s_type:
        base_filter['type_id'] = s_type
    if coach:
        base_filter['coach_id'] = coach

    # Base queryset for subscriptions
    base_qs = Subscription.objects.filter(**base_filter).select_related('type', 'member', 'coach')
    total_subs = base_qs.count()

    # 1. Popular Subscription Types
    popular_qs = SubscriptionType.objects.filter(club=club).annotate(
        total=Count(
            'subscriptions',
            filter=Q(
                subscriptions__start_date__gte=start_date,
                subscriptions__start_date__lte=end_date
            )
        )
    ).values('name', 'total').order_by('-total')[:5]

    # 2. Attendance Analysis
    att_qs = base_qs.prefetch_related('attendance_attendances')
    att_stats = att_qs.values('type__name').annotate(
        total_attendance=Count(
            'attendance_attendances',
            filter=Q(
                attendance_attendances__attendance_date__range=(start_date, end_date)
            )
        )
    )
    for item in att_stats:
        matching_subs = att_qs.filter(type__name=item['type__name'])
        total_att = sum(
            matching_subs.filter(
                attendance_attendances__attendance_date__range=(start_date, end_date)
            ).count()
            for s in matching_subs
        )
        item['avg_attendance'] = round(total_att / len(matching_subs) if matching_subs else 0, 2)

    # 3. Attendance by Day of Week
    att_by_day = Attendance.objects.filter(
        subscription__club=club,
        attendance_date__range=(start_date, end_date)
    )
    if s_type:
        att_by_day = att_by_day.filter(subscription__type_id=s_type)
    if coach:
        att_by_day = att_by_day.filter(subscription__coach_id=coach)

    att_by_day = att_by_day.annotate(
        day_of_week=Case(
            When(attendance_date__week_day=2, then=0),  # Monday
            When(attendance_date__week_day=3, then=1),  # Tuesday
            When(attendance_date__week_day=4, then=2),  # Wednesday
            When(attendance_date__week_day=5, then=3),  # Thursday
            When(attendance_date__week_day=6, then=4),  # Friday
            When(attendance_date__week_day=7, then=5),  # Saturday
            When(attendance_date__week_day=1, then=6),  # Sunday
            output_field=IntegerField()
        )
    ).values('day_of_week').annotate(total_entries=Count('id')).order_by('day_of_week')

    # 4. Freeze Analysis
    freeze_filter = {
        'subscriptions__start_date__gte': start_date,
        'subscriptions__start_date__lte': end_date,
        **({'subscriptions__type_id': s_type} if s_type else {}),
        **({'subscriptions__coach_id': coach} if coach else {})
    }
    freeze_stats = SubscriptionType.objects.filter(club=club).prefetch_related('subscriptions__freeze_requests').annotate(
        total=Count('subscriptions', filter=Q(**freeze_filter)),
        total_freezes=Count(
            'subscriptions__freeze_requests',
            filter=Q(
                subscriptions__freeze_requests__start_date__gte=start_date,
                subscriptions__freeze_requests__end_date__lte=end_date,
                subscriptions__freeze_requests__is_active=True,
                **({'subscriptions__type_id': s_type} if s_type else {}),
                **({'subscriptions__coach_id': coach} if coach else {})
            )
        ),
        frozen_subscriptions=Count(
            'subscriptions',
            filter=Q(
                subscriptions__freeze_requests__start_date__gte=start_date,
                subscriptions__freeze_requests__end_date__lte=end_date,
                subscriptions__freeze_requests__is_active=True,
                **({'subscriptions__type_id': s_type} if s_type else {}),
                **({'subscriptions__coach_id': coach} if coach else {})
            )
        )
    ).annotate(
        freeze_percentage=ExpressionWrapper(
            100.0 * F('frozen_subscriptions') / Case(
                When(total__gt=0, then=F('total')),
                default=Value(1),
                output_field=FloatField()
            ),
            output_field=FloatField()
        )
    ).values('name', 'total', 'total_freezes', 'frozen_subscriptions', 'freeze_percentage').order_by('-total_freezes')

    # 5. Revenue Analysis
    revenue_filter = {
        'subscriptions__club': club,
        'subscriptions__start_date__lte': end_date,
        'subscriptions__end_date__gte': start_date,
        **({'subscriptions__type_id': s_type} if s_type else {}),
        **({'subscriptions__coach_id': coach} if coach else {})
    }
    revenue_stats = SubscriptionType.objects.filter(club=club).prefetch_related('subscriptions').annotate(
        total_revenue=Sum('subscriptions__paid_amount', filter=Q(**revenue_filter)),
        private_revenue=Sum(
            'subscriptions__private_training_price',
            filter=Q(subscriptions__type__is_private_training=True, **revenue_filter)
        ),
        remaining_amount=Sum('subscriptions__remaining_amount', filter=Q(**revenue_filter))
    ).values('name', 'total_revenue', 'private_revenue', 'remaining_amount').order_by('-total_revenue')

    # 6. Member Behavior
    member_behavior = base_qs.annotate(
        attendance_count=Count(
            'attendance_attendances',
            filter=Q(attendance_attendances__attendance_date__range=(start_date, end_date))
        ),
        subscription_count=Count('member__subscription')
    ).values('member__name', 'attendance_count', 'subscription_count').annotate(
        is_regular=Case(
            When(attendance_count__gte=10, then=True),
            default=False,
            output_field=IntegerField()
        ),
        is_repeated=Case(
            When(subscription_count__gte=2, then=True),
            default=False,
            output_field=IntegerField()
        )
    ).order_by('-attendance_count')[:10]

    # 7. Inactive Members
    inactive_members = base_qs.annotate(
        last_attendance=Max('attendance_attendances__attendance_date')
    ).filter(
        Q(last_attendance__lte=today - timedelta(days=30)) | Q(last_attendance__isnull=True)
    ).values('member__name').annotate(subscription_count=Count('id'))[:10]

    # 8. Coach Analysis
    coach_stats = User.objects.filter(role='coach', is_active=True, club=club).annotate(
        total_clients=Count(
            'private_subscriptions',
            filter=Q(
                private_subscriptions__start_date__lte=end_date,
                private_subscriptions__end_date__gte=start_date,
                private_subscriptions__type__is_private_training=True,
                **({'private_subscriptions__type_id': s_type} if s_type else {})
            )
        ),
        total_attendance=Count(
            'private_subscriptions__attendance_attendances',
            filter=Q(
                private_subscriptions__attendance_attendances__attendance_date__range=(start_date, end_date),
                **({'private_subscriptions__type_id': s_type} if s_type else {})
            )
        ),
        total_revenue=Sum(
            'private_subscriptions__private_training_price',
            filter=Q(
                private_subscriptions__start_date__lte=end_date,
                private_subscriptions__end_date__gte=start_date,
                private_subscriptions__type__is_private_training=True,
                **({'private_subscriptions__type_id': s_type} if s_type else {})
            )
        )
    ).values('username', 'total_clients', 'total_attendance', 'total_revenue').order_by('-total_clients')

    # 9. Temporal Analysis
    temporal_stats = base_qs.annotate(month=TruncMonth('start_date')).values('month').annotate(
        total_subscriptions=Count('id'),
        total_revenue=Sum('paid_amount')
    ).order_by('month')

    # 10. Renewal Rate
    renewal_filter = {
        'subscriptions__end_date__lt': end_date,
        'subscriptions__start_date__gte': start_date,
        **({'subscriptions__type_id': s_type} if s_type else {}),
        **({'subscriptions__coach_id': coach} if coach else {})
    }
    renewal_stats = SubscriptionType.objects.filter(club=club).annotate(
        expired_subscriptions=Count('subscriptions', filter=Q(**renewal_filter)),
        renewed_subscriptions=Count(
            'subscriptions',
            filter=Q(
                subscriptions__end_date__lt=end_date,
                subscriptions__start_date__gte=start_date,
                subscriptions__member__subscription__start_date__gt=F('subscriptions__end_date'),
                subscriptions__member__subscription__start_date__lte=F('subscriptions__end_date') + timedelta(days=30),
                subscriptions__member__subscription__type=F('subscriptions__type'),
                **({'subscriptions__type_id': s_type} if s_type else {}),
                **({'subscriptions__coach_id': coach} if coach else {})
            )
        )
    ).annotate(
        renewal_rate=ExpressionWrapper(
            100.0 * F('renewed_subscriptions') / Case(
                When(expired_subscriptions__gt=0, then=F('expired_subscriptions')),
                default=Value(1),
                output_field=FloatField()
            ),
            output_field=FloatField()
        )
    ).values('name', 'expired_subscriptions', 'renewed_subscriptions', 'renewal_rate').order_by('-renewal_rate')

    # 11. Subscriptions Nearing Expiry
    nearing_expiry = Subscription.objects.filter(
        club=club,
        end_date__range=(today, today + timedelta(days=7)),
        **({'type_id': s_type} if s_type else {}),
        **({'coach_id': coach} if coach else {})
    ).order_by('end_date')

    # Construct response
    response = {
        'popular_subscription_types': list(popular_qs),
        'attendance_analysis': {
            'highest_attendance_types': list(att_stats),
            'by_day_of_week': [
                {
                    'day': ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'][d['day_of_week']],
                    'total_entries': d['total_entries']
                }
                for d in att_by_day
            ]
        },
        'freeze_analysis': list(freeze_stats),
        'revenue_analysis': list(revenue_stats),
        'member_behavior': {
            'active_members': MemberBehaviorSerializer(member_behavior, many=True).data,  # Fixed: Use MemberBehaviorSerializer
            'inactive_members': list(inactive_members)
        },
        'coach_analysis': list(coach_stats),
        'temporal_analysis': [
            {
                'month': t['month'].strftime('%Y-%m'),
                'total_subscriptions': t['total_subscriptions'],
                'total_revenue': t['total_revenue'] or 0
            }
            for t in temporal_stats
        ],
        'renewal_rate_by_type': [
            {
                'name': r['name'],
                'expired_subscriptions': r['expired_subscriptions'],
                'renewed_subscriptions': r['renewed_subscriptions'],
                'renewal_rate': round(r['renewal_rate'], 2)
            }
            for r in renewal_stats
        ],
        'nearing_expiry': SubscriptionSerializer(nearing_expiry, many=True).data,
        'date_range': {'start_date': str(start_date), 'end_date': str(end_date)}
    }

    return Response(response)