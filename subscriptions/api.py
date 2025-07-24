from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.db.models import Count, Sum, Avg, Q, BooleanField, Case, When, F, Max, IntegerField, FloatField, Value, ExpressionWrapper, DecimalField, OuterRef, Subquery
from django.db.models.functions import TruncMonth
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
import logging

from .models import Subscription, SubscriptionType, FreezeRequest, Feature, PaymentMethod, Payment, SpecialOffer
from .serializers import SubscriptionSerializer, SubscriptionTypeSerializer, CoachReportSerializer, MemberBehaviorSerializer, FeatureSerializer, PaymentMethodSerializer, PaymentSerializer, SpecialOfferSerializer
from finance.models import Income, IncomeSource
from members.models import Member
from accounts.models import User
from attendance.models import Attendance
from staff.models import StaffAttendance
from permissions.permissions import IsOwnerOrRelatedToClub

logger = logging.getLogger(__name__)

FULL_ACCESS_ROLES = ['owner', 'admin']

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def feature_list(request):
    """List or create features."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        features = Feature.objects.filter(club=request.user.club, is_active=True)
        serializer = FeatureSerializer(features, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = FeatureSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(club=request.user.club)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def feature_detail(request, pk):
    """Retrieve, update, or delete a feature."""
    feature = get_object_or_404(Feature, pk=pk, club=request.user.club)
    
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        serializer = FeatureSerializer(feature)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        if request.user.role not in FULL_ACCESS_ROLES:
            return Response({'error': 'غير مسموح بالتعديل.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = FeatureSerializer(feature, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if request.user.role not in FULL_ACCESS_ROLES:
            return Response({'error': 'غير مسموح بالحذف.'}, status=status.HTTP_403_FORBIDDEN)
        
        if SubscriptionType.objects.filter(features=feature).exists():
            return Response({"error": "لا يمكن حذف ميزة مرتبطة بنوع اشتراك."}, status=status.HTTP_400_BAD_REQUEST)
        feature.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def payment_method_list(request):
    """List or create payment methods."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        methods = PaymentMethod.objects.filter(club=request.user.club, is_active=True)
        serializer = PaymentMethodSerializer(methods, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = PaymentMethodSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(club=request.user.club)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def payment_method_detail(request):
    """List or create payment methods."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        methods = PaymentMethod.objects.filter(club=request.user.club, is_active=True)
        serializer = PaymentMethodSerializer(methods, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = PaymentMethodSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(club=request.user.club)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def subscription_type_list(request):
    """List or create subscription types with active special offers."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        now = timezone.now()
        search_term = request.GET.get('q', '')
        status_filter = request.GET.get('status', 'all')
        duration = request.GET.get('duration', '')
        feature_id = request.GET.get('feature_id', '')
        ordering = request.GET.get('ordering', '')

        types = SubscriptionType.objects.filter(club=request.user.club)
        types = types.annotate(
            active_subscriptions_count=Count('subscriptions', filter=Q(subscriptions__end_date__gte=now.date())),
            current_discount=Subquery(
                SpecialOffer.objects.filter(
                    subscription_type=OuterRef('pk'),
                    start_datetime__lte=now,
                    end_datetime__gte=now,
                    is_active=True
                ).values('discount_percentage')[:1]
            ),
            discounted_price=Case(
                When(current_discount__isnull=False,
                     then=ExpressionWrapper(
                         F('price') * (100 - F('current_discount')) / 100,
                         output_field=DecimalField(max_digits=10, decimal_places=2)
                     )),
                default=F('price'),
                output_field=DecimalField(max_digits=10, decimal_places=2)
            )
        ).filter(
            Q(is_golden_only=False) |
            (Q(is_golden_only=True) &
             Q(specialoffer__start_datetime__lte=now,
               specialoffer__end_datetime__gte=now,
               specialoffer__is_golden=True,
               specialoffer__is_active=True))
        )

        if search_term:
            types = types.filter(Q(name__icontains=search_term))
        if status_filter != 'all':
            types = types.filter(is_active=(status_filter == 'active'))
        if duration:
            try:
                types = types.filter(duration_days=int(duration))
            except ValueError:
                pass
        if feature_id:
            try:
                types = types.filter(features__id=int(feature_id))
            except ValueError:
                pass
        if ordering:
            if ordering in ['active_subscribers', '-active_subscribers']:
                types = types.order_by(f'{"" if ordering.startswith("-") else "-"}{ordering.lstrip("-")}', '-id')
            else:
                types = types.order_by(ordering)

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(types, request)
        serializer = SubscriptionTypeSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    elif request.method == 'POST':
        # 🔒 السماح فقط للـ owner و admin
        if request.user.role not in ['owner', 'admin']:
            return Response({'error': 'غير مسموح: صلاحيات غير كافية لإضافة نوع اشتراك.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = SubscriptionTypeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            subscription_type = serializer.save(club=request.user.club)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def subscription_type_detail(request, pk):
    """Retrieve, update, or delete a subscription type."""
    subscription_type = get_object_or_404(SubscriptionType, pk=pk)
    
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        serializer = SubscriptionTypeSerializer(subscription_type)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        if request.user.role not in FULL_ACCESS_ROLES:
            return Response({'error': 'غير مسموح بالتعديل.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = SubscriptionTypeSerializer(subscription_type, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if request.user.role not in FULL_ACCESS_ROLES:
            return Response({'error': 'غير مسموح بالحذف.'}, status=status.HTTP_403_FORBIDDEN)
        
        if Subscription.objects.filter(type=subscription_type).exists():
            return Response({'error': 'لا يمكن حذف نوع اشتراك مرتبط باشتراكات نشطة'}, status=status.HTTP_400_BAD_REQUEST)
        subscription_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_subscription_types(request):
    """List active subscription types."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    types = SubscriptionType.objects.filter(is_active=True, club=request.user.club)
    types = types.order_by('-id') 
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(types, request)
    serializer = SubscriptionTypeSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def subscription_list(request):
    logger.info(f"Processing subscription_list for user: {request.user.username}, params: {request.query_params}")

    if not request.user.club:
        logger.warning(f"User {request.user.username} not associated with a club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        search_term = request.query_params.get('searchTerm', request.query_params.get('search_term', '')).strip()
        identifier = request.query_params.get('identifier', '').strip()
        status_param = request.query_params.get('status', '').strip()
        today = timezone.now().date()
        ordering = request.query_params.get('ordering', '')

        # التحقق من وجود معايير بحث
        if not (search_term or identifier or status_param or
                request.query_params.get('member_id') or
                request.query_params.get('type_id') or
                request.query_params.get('start_date') or
                request.query_params.get('end_date')):
            logger.info(f"No search criteria provided by user: {request.user.username}")
            return Response({'message': 'يرجى إدخال معايير البحث (اسم، رقم هاتف، RFID، حالة الاشتراك، معرف العضو، نوع الاشتراك، تاريخ البدء، أو تاريخ الانتهاء).'}, status=status.HTTP_400_BAD_REQUEST)

        subscriptions = Subscription.objects.select_related('member', 'type', 'club').filter(club=request.user.club.id)

        # تحديد الوصول بناءً على الدور
        if request.user.role not in ['owner', 'admin']:
            filters = Q()
            attendance = StaffAttendance.objects.filter(
                staff=request.user, club=request.user.club, check_out__isnull=True
            ).order_by('-check_in').first()

            if attendance:
                filters |= Q(
                    created_by=request.user,
                    start_date__gte=attendance.check_in,
                    start_date__lte=attendance.check_out or timezone.now()
                )
            subscriptions = subscriptions.filter(filters)

        # إضافة فلتر افتراضي للمبالغ المتبقية إذا لم يتم تحديد status_param
        if not status_param:
            subscriptions = subscriptions.filter(remaining_amount__gt=0)

        if identifier:
            subscriptions = subscriptions.annotate(
                can_enter=Case(
                    When(
                        start_date__lte=today,
                        end_date__gte=today,
                        type__is_active=True,
                        is_cancelled=False,
                        freeze_requests__isnull=True,
                        then=Case(
                            When(type__max_entries=0, then=True),
                            When(entry_count__lt=F('type__max_entries'), then=True),
                            default=False,
                            output_field=BooleanField()
                        )
                    ),
                    default=False,
                    output_field=BooleanField()
                )
            ).filter(
                Q(member__rfid_code=identifier) | Q(member__phone=identifier)
            )

        if search_term or status_param:
            # فلترة بالبحث
            if search_term:
                subscriptions = subscriptions.filter(
                    Q(member__rfid_code__icontains=search_term) |
                    Q(member__phone__icontains=search_term) |
                    Q(member__name__icontains=search_term)
                )

            # فلترة بالحقول المباشرة
            for param, field in [
                ('member_id', 'member_id'),
                ('type_id', 'type_id'),
                ('start_date', 'start_date__gte'),
                ('end_date', 'end_date__lte'),
            ]:
                if request.query_params.get(param):
                    try:
                        subscriptions = subscriptions.filter(**{field: request.query_params.get(param)})
                    except ValueError as e:
                        logger.error(f"Invalid value for {param}: {request.query_params.get(param)}")
                        return Response({'error': f'قيمة غير صالحة لـ {param}'}, status=status.HTTP_400_BAD_REQUEST)

            # فلترة بالحالة
            if status_param:
                if status_param == 'active':
                    subscriptions = subscriptions.filter(
                        start_date__lte=today,
                        end_date__gte=today
                    ).filter(
                        Q(type__max_entries=0) | Q(entry_count__lt=F('type__max_entries'))
                    )
                elif status_param == 'expired':
                    subscriptions = subscriptions.filter(
                        Q(end_date__lt=today) | Q(entry_count__gte=F('type__max_entries'), type__max_entries__gt=0)
                    )
                elif status_param == 'upcoming':
                    subscriptions = subscriptions.filter(start_date__gt=today)
                elif status_param == 'remaining':
                    subscriptions = subscriptions.filter(remaining_amount__gt=0)
                elif status_param == 'cancelled':
                    subscriptions = subscriptions.filter(is_cancelled=True)
                elif status_param == 'nearing_expiry':
                    subscriptions = subscriptions.filter(
                        end_date__range=(today, today + timedelta(days=7))
                    )
                else:
                    logger.error(f"Invalid status parameter: {status_param}")
                    return Response({'error': f'حالة غير صالحة: {status_param}'}, status=status.HTTP_400_BAD_REQUEST)

        if ordering:
            if ordering in ['remaining_amount', '-remaining_amount', 'start_date', '-start_date', 'end_date', '-end_date']:
                subscriptions = subscriptions.order_by(ordering, '-end_date')
            else:
                try:
                    subscriptions = subscriptions.order_by(ordering)
                except Exception as e:
                    logger.error(f"Invalid ordering parameter: {ordering}")
                    return Response({'error': f'ترتيب غير صالح: {ordering}'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            subscriptions = subscriptions.order_by('-remaining_amount', 'end_date')

        # Pagination and serialization
        paginator = PageNumberPagination()
        paginator.page_size = min(int(request.query_params.get('page_size', 20)), 100)  # تحديد أقصى حجم للصفحة
        page = paginator.paginate_queryset(subscriptions, request)
        serializer = SubscriptionSerializer(page or subscriptions, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data) if page else Response(serializer.data)

    if request.method == 'POST':
        mutable_data = request.data.copy()
        mutable_data['created_by'] = request.user.id
        mutable_data['club'] = request.user.club.id
        payment_data = mutable_data.pop('payments', [])
        mutable_data.pop('paid_amount', None)
        mutable_data.pop('remaining_amount', None)
        mutable_data.pop('special_offer', None)

        with transaction.atomic():
            subscription_type = get_object_or_404(SubscriptionType, id=mutable_data['type'], club=request.user.club)
            now = timezone.now()

            # التحقق من أن نوع الاشتراك مختلف عن الاشتراكات النشطة للعضو
            member_id = mutable_data.get('member')
            start_date = mutable_data.get('start_date', timezone.now().date())
            today = timezone.now().date()
            active_subscriptions = Subscription.objects.filter(
                member=member_id,
                club=request.user.club,
                start_date__lte=today,
                end_date__gte=today,
                entry_count__lt=F('type__max_entries'),
                type__max_entries__gt=0
            ).exclude(is_cancelled=True)
            if active_subscriptions.filter(type=subscription_type).exists():
                return Response(
                    {"non_field_errors": ["لا يمكن إنشاء اشتراك جديد بنفس نوع اشتراك نشط."]},
                    status=status.HTTP_400_BAD_REQUEST
                )

            active_offer = SpecialOffer.objects.filter(
                subscription_type=subscription_type,
                start_datetime__lte=now,
                end_datetime__gte=now,
                is_active=True
            ).first()

            if active_offer:
                discount = active_offer.discount_percentage
                effective_price = (subscription_type.price * (100 - discount) / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            else:
                effective_price = subscription_type.price

            serializer = SubscriptionSerializer(data=mutable_data, context={'request': request})
            if serializer.is_valid():
                subscription = serializer.save()

                total_paid = Decimal('0')
                for payment in payment_data:
                    payment['subscription'] = subscription.id
                    payment['created_by'] = request.user.id
                    payment_serializer = PaymentSerializer(data=payment, context={'request': request})
                    if payment_serializer.is_valid():
                        payment_serializer.save()
                        total_paid += Decimal(payment['amount'])
                    else:
                        return Response(payment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                subscription.paid_amount = total_paid
                subscription.remaining_amount = (effective_price - total_paid).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                subscription.save()

                if total_paid > 0 or (subscription.coach and subscription.coach_compensation_type == 'external' and subscription.coach_compensation_value > 0):
                    source, _ = IncomeSource.objects.get_or_create(
                        club=subscription.club, name='اشتراكات', defaults={'description': 'إيراد عن اشتراك'}
                    )
                    amount = total_paid
                    if subscription.coach and subscription.coach_compensation_type == 'external':
                        amount += subscription.coach_compensation_value or 0
                    description = f"اشتراك {subscription.member.name}"
                    if subscription.coach:
                        description += f" مع الكابتن {subscription.coach.username}" + (
                            f" بمبلغ خارجي {subscription.coach_compensation_value} جنيه" if subscription.coach_compensation_type == 'external'
                            else f" بنسبة {subscription.coach_compensation_value}% من الاشتراك"
                        )
                    Income.objects.create(
                        club=subscription.club, source=source, amount=amount, description=description,
                        date=timezone.now(), received_by=request.user
                    )

                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def subscription_detail(request, pk):
    """Retrieve, update, or delete a subscription."""
    subscription = get_object_or_404(Subscription, pk=pk)
    
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        if request.user.role not in FULL_ACCESS_ROLES:
            return Response({'error': 'غير مسموح بالتعديل.'}, status=status.HTTP_403_FORBIDDEN)
        
        mutable_data = request.data.copy()
        mutable_data['club'] = request.user.club.id
        
        with transaction.atomic():
            serializer = SubscriptionSerializer(subscription, data=mutable_data, partial=True, context={'request': request})
            if serializer.is_valid():
                old_type = subscription.type
                old_paid_amount = subscription.paid_amount or Decimal('0')
                old_coach_compensation_value = (
                    subscription.coach_compensation_value or Decimal('0')
                ) if (subscription.coach and subscription.coach_compensation_type == 'external') else Decimal('0')
                
                updated_subscription = serializer.save()
                
                new_type = updated_subscription.type
                new_paid_amount = updated_subscription.paid_amount or Decimal('0')
                new_coach_compensation_value = (
                    updated_subscription.coach_compensation_value or Decimal('0')
                ) if (updated_subscription.coach and updated_subscription.coach_compensation_type == 'external') else Decimal('0')
                
                now = timezone.now()
                active_offer = SpecialOffer.objects.filter(
                    subscription_type=new_type,
                    start_datetime__lte=now,
                    end_datetime__gte=now,
                    is_active=True
                ).first()
                effective_price = (
                    (new_type.price * (100 - active_offer.discount_percentage) / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                    if active_offer else new_type.price
                )
                
                if old_type != new_type:
                    updated_subscription.remaining_amount = (effective_price - new_paid_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                    updated_subscription.save()
                
                additional_amount = (new_paid_amount - old_paid_amount) + (new_coach_compensation_value - old_coach_compensation_value)
                
                if old_type != new_type:
                    old_effective_price = (
                        (old_type.price * (100 - active_offer.discount_percentage) / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                        if active_offer and active_offer.subscription_type == old_type
                        else old_type.price
                    )
                    price_difference = effective_price - old_effective_price
                    if price_difference > 0:
                        additional_amount += price_difference
                
                if additional_amount > 0:
                    source, _ = IncomeSource.objects.get_or_create(
                        club=updated_subscription.club, 
                        name='اشتراكات', 
                        defaults={'description': 'إيراد عن اشتراك'}
                    )
                    description = f"إيراد إضافي لاشتراك {updated_subscription.member.name}"
                    if old_type != new_type:
                        description += f" (تغيير نوع الاشتراك من {old_type.name} إلى {new_type.name})"
                    if updated_subscription.coach:
                        description += f" مع الكابتن {updated_subscription.coach.username}" + (
                            f" بمبلغ خارجي {updated_subscription.coach_compensation_value} جنيه"
                            if updated_subscription.coach_compensation_type == 'external'
                            else f" بنسبة {updated_subscription.coach_compensation_value}% من الاشتراك"
                        )
                    Income.objects.create(
                        club=updated_subscription.club,
                        source=source,
                        amount=additional_amount,
                        description=description,
                        date=timezone.now().date(),
                        received_by=request.user
                    )
                
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if request.user.role not in FULL_ACCESS_ROLES:
            return Response({'error': 'غير مسموح بالحذف.'}, status=status.HTTP_403_FORBIDDEN)
        
        subscription.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_subscriptions(request):
    """List active subscriptions."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    today = timezone.now().date()
    subscriptions = Subscription.objects.filter(
        start_date__lte=today,
        end_date__gte=today,
        entry_count__lt=F('type__max_entries') | Q(type__max_entries=0),
        club=request.user.club
    )
    
    subscriptions = subscriptions.order_by('-start_date')
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expired_subscriptions(request):
    """List expired subscriptions."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    today = timezone.now().date()
    subscriptions = Subscription.objects.filter(
        Q(end_date__lt=today) | Q(entry_count__gte=F('type__max_entries'), type__max_entries__gt=0),
        club=request.user.club
    )
    
    subscriptions = subscriptions.order_by('-end_date')
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upcoming_subscriptions(request):
    """List upcoming subscriptions."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    today = timezone.now().date()
    subscriptions = Subscription.objects.filter(start_date__gt=today, club=request.user.club)
    
    subscriptions = subscriptions.order_by('start_date')
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def renew_subscription(request, pk):
    """Renew a subscription by creating a new subscription."""
    old_subscription = get_object_or_404(Subscription, pk=pk)
    
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if old_subscription.is_cancelled:
        return Response({"error": "لا يمكن تجديد اشتراك ملغى"}, status=status.HTTP_400_BAD_REQUEST)
    
    payment_data = request.data.get('payments', [])
    new_type_id = request.data.get('type', old_subscription.type.id)  # دعم تغيير نوع الاشتراك
    start_date = request.data.get('start_date', old_subscription.end_date)  # دعم تحديد تاريخ البدء
    
    with transaction.atomic():
        subscription_type = get_object_or_404(SubscriptionType, id=new_type_id, club=request.user.club)
        now = timezone.now()
        
        active_offer = SpecialOffer.objects.filter(
            subscription_type=subscription_type,
            start_datetime__lte=now,
            end_datetime__gte=now,
            is_active=True
        ).first()
        effective_price = (
            (subscription_type.price * (100 - active_offer.discount_percentage) / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            if active_offer else subscription_type.price
        )
        
        today = timezone.now().date()
        active_subscriptions = Subscription.objects.filter(
            member=old_subscription.member,
            club=request.user.club,
            start_date__lte=today,
            end_date__gte=today,
            entry_count__lt=F('type__max_entries'),
            type__max_entries__gt=0
        ).exclude(is_cancelled=True)
        if active_subscriptions.exists():
            latest_active_subscription = active_subscriptions.order_by('-end_date').first()
            max_end_date = latest_active_subscription.end_date
            if start_date <= max_end_date:
                return Response(
                    {"non_field_errors": [f"لا يمكن إنشاء اشتراك جديد يبدأ قبل {max_end_date} بسبب وجود اشتراك نشط."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        new_subscription_data = {
            'member': old_subscription.member.id,
            'type': subscription_type.id,
            'club': old_subscription.club.id,
            'start_date': start_date,
            'end_date': start_date + timedelta(days=subscription_type.duration_days),
            'entry_count': 0,
            'paid_amount': Decimal('0'),
            'remaining_amount': effective_price,
            'created_by': request.user.id
        }
        
        # التعامل مع بيانات المدرب
        if old_subscription.coach:
            new_subscription_data['coach'] = old_subscription.coach.id
            new_subscription_data['coach_compensation_type'] = old_subscription.coach_compensation_type
            new_subscription_data['coach_compensation_value'] = old_subscription.coach_compensation_value or Decimal('0.00')
        else:
            new_subscription_data['coach'] = None
            new_subscription_data['coach_compensation_type'] = None
            new_subscription_data['coach_compensation_value'] = Decimal('0.00')
        
        serializer = SubscriptionSerializer(data=new_subscription_data, context={'request': request})
        if serializer.is_valid():
            new_subscription = serializer.save()
            
            total_paid = Decimal('0')
            for payment in payment_data:
                payment['subscription'] = new_subscription.id
                payment['created_by'] = request.user.id
                payment_serializer = PaymentSerializer(data=payment, context={'request': request})
                if payment_serializer.is_valid():
                    payment_serializer.save()
                    total_paid += Decimal(payment['amount'])
                else:
                    return Response(payment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            new_subscription.paid_amount = total_paid
            new_subscription.remaining_amount = effective_price - total_paid
            new_subscription.save()
            
            source, _ = IncomeSource.objects.get_or_create(
                club=new_subscription.club, name='تجديد اشتراك', defaults={'description': 'إيراد عن تجديد اشتراك'}
            )
            amount = total_paid
            if new_subscription.coach and new_subscription.coach_compensation_type == 'external':
                amount += new_subscription.coach_compensation_value or Decimal('0.00')
            Income.objects.create(
                club=new_subscription.club, source=source, amount=amount,
                description=f"تجديد اشتراك {new_subscription.member.name}" + (
                    f" مع الكابتن {new_subscription.coach.username} بمبلغ خارجي {new_subscription.coach_compensation_value} جنيه"
                    if new_subscription.coach and new_subscription.coach_compensation_type == 'external' else ""
                ),
                date=timezone.now(),
                received_by=request.user
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def make_payment(request, pk):
    """Add a payment to an existing subscription."""
    subscription = get_object_or_404(Subscription, pk=pk)
    
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if subscription.is_cancelled:
        return Response({"error": "لا يمكن إضافة دفعات لاشتراك ملغى"}, status=status.HTTP_400_BAD_REQUEST)
    if subscription.remaining_amount <= 0:
        return Response({"error": "لا يوجد مبلغ متبقي للدفع"}, status=status.HTTP_400_BAD_REQUEST)
    
    payment_data = request.data.copy()
    payment_data['subscription'] = subscription.id
    payment_data['created_by'] = request.user.id

    with transaction.atomic():
        payment_serializer = PaymentSerializer(data=payment_data, context={'request': request})
        if payment_serializer.is_valid():
            payment = payment_serializer.save()
            subscription.paid_amount += payment.amount
            subscription.remaining_amount = max(Decimal('0'), subscription.type.price - subscription.paid_amount)
            subscription.save()

            source, _ = IncomeSource.objects.get_or_create(
                club=subscription.club, name='اشتراكات', defaults={'description': 'إيراد عن اشتراك'}
            )
            Income.objects.create(
                club=subscription.club, source=source, amount=payment.amount,
                description=f"إيراد اشتراك {subscription.member.name}",
                date=timezone.now(), received_by=request.user
            )

            serializer = SubscriptionSerializer(subscription)
            return Response(serializer.data)
        return Response(payment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_subscription(request, pk):
    """Cancel a subscription and process refund."""
    subscription = get_object_or_404(Subscription, pk=pk)
    
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.user.role not in FULL_ACCESS_ROLES:
        return Response({'error': 'غير مسموح بالإلغاء.'}, status=status.HTTP_403_FORBIDDEN)
    
    if subscription.is_cancelled:
        return Response({"error": "الاشتراك ملغى بالفعل"}, status=status.HTTP_400_BAD_REQUEST)
    
    with transaction.atomic():
        refund_amount = subscription.calculate_refunded_amount()
        subscription.is_cancelled = True
        subscription.cancellation_date = timezone.now().date()
        subscription.refund_amount = refund_amount
        subscription.save()

        if refund_amount > 0:
            source, _ = IncomeSource.objects.get_or_create(
                club=subscription.club, name='الغاء اشتراك', defaults={'description': 'إيراد سالب عن استرداد اشتراك'}
            )
            Income.objects.create(
                club=subscription.club, source=source, amount=-refund_amount,
                description=f"استرداد اشتراك {subscription.member.name}",
                date=timezone.now(), received_by=request.user
            )

        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def member_subscriptions(request):
    """List subscriptions for a specific member."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    member_id = request.query_params.get('member_id')
    search_term = request.query_params.get('identifier', '')
    if not member_id:
        return Response({"error": "معرف العضو مطلوب"}, status=status.HTTP_400_BAD_REQUEST)
    
    subscriptions = Subscription.objects.select_related('member', 'type', 'club').filter(
        member_id=member_id, club=request.user.club
    )

    if search_term:
        subscriptions = subscriptions.filter(
            Q(member__name__icontains=search_term) | Q(member__phone__icontains=search_term) | Q(member__rfid_code__icontains=search_term)
        )
    subscriptions = subscriptions.order_by('-start_date')
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(subscriptions, request)
    serializer = SubscriptionSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_stats(request):
    """Get subscription statistics."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    today = timezone.now().date()
    base_query = Subscription.objects.filter(club=request.user.club)

    stats = {
        'total': base_query.count(),
        'active': base_query.filter(start_date__lte=today, end_date__gte=today).count(),
        'expired': base_query.filter(end_date__lt=today).count(),
        'upcoming': base_query.filter(start_date__gt=today).count(),
        'cancelled': base_query.filter(is_cancelled=True).count(),
    }
    return Response(stats)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_freeze(request, pk):
    """Request a freeze for a subscription."""
    subscription = get_object_or_404(Subscription, pk=pk)
    
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    requested_days = request.data.get('requested_days', 0)
    start_date_str = request.data.get('start_date', timezone.now().date())
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date() if isinstance(start_date_str, str) else start_date_str
    except ValueError:
        return Response({'error': 'صيغة تاريخ البدء غير صحيحة (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
    
    if requested_days <= 0:
        return Response({'error': 'عدد أيام التجميد يجب أن يكون موجبًا'}, status=status.HTTP_400_BAD_REQUEST)
    if start_date < timezone.now().date():
        return Response({'error': 'لا يمكن أن يكون تاريخ البدء في الماضي'}, status=status.HTTP_400_BAD_REQUEST)
    if subscription.freeze_requests.filter(is_active=True).exists():
        return Response({'error': 'هذا الاشتراك لديه تجميد نشط بالفعل'}, status=status.HTTP_400_BAD_REQUEST)
    
    total_freeze_days = sum(fr.requested_days for fr in subscription.freeze_requests.filter(is_active=False, cancelled_at__isnull=True))
    if total_freeze_days + requested_days > subscription.type.max_freeze_days:
        return Response({'error': f'إجمالي أيام التجميد ({total_freeze_days + requested_days}) يتجاوز الحد الأقصى ({subscription.type.max_freeze_days})'}, status=status.HTTP_400_BAD_REQUEST)
    
    freeze_request = FreezeRequest(subscription=subscription, requested_days=requested_days, start_date=start_date, is_active=True, created_by=request.user)
    freeze_request.save()
    serializer = SubscriptionSerializer(subscription)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_freeze(request, freeze_id):
    """Cancel a freeze request."""
    freeze_request = get_object_or_404(FreezeRequest, pk=freeze_id)
    
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.user.role not in FULL_ACCESS_ROLES:
        return Response({'error': 'غير مسموح بإلغاء التجميد.'}, status=status.HTTP_403_FORBIDDEN)
    
    if not freeze_request.is_active:
        return Response({'error': 'طلب التجميد غير نشط'}, status=status.HTTP_400_BAD_REQUEST)
    
    today = timezone.now().date()
    used_days = max(0, min((today - freeze_request.start_date).days, freeze_request.requested_days))
    subscription = freeze_request.subscription
    remaining_days = freeze_request.requested_days - used_days
    if remaining_days > 0:
        subscription.end_date -= timedelta(days=remaining_days)
        subscription.save()
    
    freeze_request.is_active = False
    freeze_request.cancelled_at = timezone.now()
    freeze_request.save()
    serializer = SubscriptionSerializer(subscription)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def special_offer_list(request):
    """List or create special offers."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        offers = SpecialOffer.objects.filter(club=request.user.club, is_active=True)
        serializer = SpecialOfferSerializer(offers, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = SpecialOfferSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(club=request.user.club)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def special_offer_detail(request, pk):
    """Retrieve, update, or delete a special offer."""
    offer = get_object_or_404(SpecialOffer, pk=pk, club=request.user.club)
    
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        serializer = SpecialOfferSerializer(offer)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        if request.user.role not in FULL_ACCESS_ROLES:
            return Response({'error': 'غير مسموح بالتعديل.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = SpecialOfferSerializer(offer, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if request.user.role not in FULL_ACCESS_ROLES:
            return Response({'error': 'غير مسموح بالحذف.'}, status=status.HTTP_403_FORBIDDEN)
        
        offer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_analytics(request):
    """Get subscription analytics."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    today = timezone.now().date()
    club = request.user.club
    start = request.query_params.get('start_date')
    end = request.query_params.get('end_date')
    s_type = request.query_params.get('subscription_type')
    coach = request.query_params.get('coach')
    
    try:
        start_date = datetime.strptime(start, '%Y-%m-%d').date() if start else today - timedelta(days=90)
        end_date = datetime.strptime(end, '%Y-%m-%d').date() if end else today
    except ValueError:
        return Response({'error': 'صيغة التاريخ غير صحيحة (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

    base_filter = {'club': club, 'start_date__lte': end_date, 'end_date__gte': start_date}
    if s_type:
        base_filter['type_id'] = s_type
    if coach:
        base_filter['coach_id'] = coach
    
    base_qs = Subscription.objects.filter(**base_filter).select_related('type', 'member', 'coach').distinct()
    total_subs = base_qs.count()
    popular_qs = SubscriptionType.objects.filter(club=club).annotate(
        total=Count('subscriptions', filter=Q(subscriptions__start_date__gte=start_date, subscriptions__start_date__lte=end_date))
    ).values('name', 'total').order_by('-total')[:5]
    att_qs = base_qs.prefetch_related('attendance_attendances')
    att_stats = att_qs.values('type__name').annotate(
        total_attendance=Count('attendance_attendances', filter=Q(attendance_attendances__timestamp__date__range=(start_date, end_date)))
    )
    for item in att_stats:
        matching_subs = att_qs.filter(type__name=item['type__name'])
        total_att = sum(
            matching_subs.filter(attendance_attendances__timestamp__date__range=(start_date, end_date)).count()
            for s in matching_subs
        )
        item['avg_attendance'] = round(total_att / len(matching_subs) if matching_subs else 0, 2)
    
    att_by_day = Attendance.objects.filter(
        subscription__club=club, timestamp__date__range=(start_date, end_date)
    ).filter(subscription__type_id=s_type if s_type else Q(), subscription__coach_id=coach if coach else Q()).annotate(
        day_of_week=Case(
            When(timestamp__week_day=2, then=0), When(timestamp__week_day=3, then=1),
            When(timestamp__week_day=4, then=2), When(timestamp__week_day=5, then=3),
            When(timestamp__week_day=6, then=4), When(timestamp__week_day=7, then=5),
            When(timestamp__week_day=1, then=6), output_field=IntegerField()
        )
    ).values('day_of_week').annotate(total_entries=Count('id')).order_by('day_of_week')
    
    freeze_filter = {'subscriptions__start_date__gte': start_date, 'subscriptions__start_date__lte': end_date}
    if s_type:
        freeze_filter['subscriptions__type_id'] = s_type
    if coach:
        freeze_filter['subscriptions__coach_id'] = coach
    freeze_stats = SubscriptionType.objects.filter(club=club).prefetch_related('subscriptions__freeze_requests').annotate(
        total=Count('subscriptions', filter=Q(**freeze_filter)),
        total_freezes=Count('subscriptions__freeze_requests', filter=Q(
            subscriptions__freeze_requests__start_date__gte=start_date, subscriptions__freeze_requests__end_date__lte=end_date,
            subscriptions__freeze_requests__is_active=True, **({'subscriptions__type_id': s_type} if s_type else {}),
            **({'subscriptions__coach_id': coach} if coach else {})
        )),
        frozen_subscriptions=Count('subscriptions', filter=Q(
            subscriptions__freeze_requests__start_date__gte=start_date, subscriptions__freeze_requests__end_date__lte=end_date,
            subscriptions__freeze_requests__is_active=True, **({'subscriptions__type_id': s_type} if s_type else {}),
            **({'subscriptions__coach_id': coach} if coach else {})
        ))
    ).annotate(
        freeze_percentage=ExpressionWrapper(
            100.0 * F('frozen_subscriptions') / Case(When(total__gt=0, then=F('total')), default=Value(1), output_field=FloatField()),
            output_field=FloatField()
        )
    ).values('name', 'total', 'total_freezes', 'frozen_subscriptions', 'freeze_percentage').order_by('-total_freezes')
    
    revenue_filter = {'subscriptions__club': club, 'subscriptions__start_date__lte': end_date, 'subscriptions__start_date__gte': start_date}
    if s_type:
        revenue_filter['subscriptions__type_id'] = s_type
    if coach:
        revenue_filter['subscriptions__coach_id'] = coach
    revenue_stats = SubscriptionType.objects.filter(club=club).prefetch_related('subscriptions').annotate(
        total_revenue=Sum('subscriptions__paid_amount', filter=Q(**revenue_filter)),
        coach_compensation_revenue=Sum('subscriptions__coach_compensation_value', filter=Q(
            subscriptions__coach_compensation_type='external', **revenue_filter
        )),
        remaining_amount=Sum('subscriptions__remaining_amount', filter=Q(**revenue_filter))
    ).values('name', 'total_revenue', 'coach_compensation_revenue', 'remaining_amount').order_by('-total_revenue')
    
    member_behavior = base_qs.annotate(
        attendance_count=Count('attendance_attendances', filter=Q(attendance_attendances__timestamp__date__range=(start_date, end_date))),
        subscription_count=Count('member__subscription')
    ).values('member__name', 'attendance_count', 'subscription_count').annotate(
        is_regular=Case(When(attendance_count__gte=10, then=True), default=False, output_field=IntegerField()),
        is_repeated=Case(When(subscription_count__gte=2, then=True), default=False, output_field=IntegerField())
    ).order_by('-attendance_count')[:10]
    
    inactive_members = base_qs.annotate(last_attendance=Max('attendance_attendances__timestamp__date')).filter(
        Q(last_attendance__lte=today - timedelta(days=30)) | Q(last_attendance__isnull=True)
    ).values('member__name').annotate(subscription_count=Count('id'))[:10]
    
    coach_stats = User.objects.filter(role='coach', is_active=True, club=club).annotate(
        total_clients=Count('private_subscriptions', filter=Q(
            private_subscriptions__start_date__lte=end_date, private_subscriptions__end_date__gte=start_date,
            private_subscriptions__type__is_private_training=True, **({'private_subscriptions__type_id': s_type} if s_type else {})
        )),
        total_attendance=Count('private_subscriptions__attendance_attendances', filter=Q(
            private_subscriptions__attendance_attendances__timestamp__date__range=(start_date, end_date),
            **({'private_subscriptions__type_id': s_type} if s_type else {})
        )),
        total_revenue=Sum('private_subscriptions__coach_compensation_value', filter=Q(
            private_subscriptions__start_date__lte=end_date, private_subscriptions__end_date__gte=start_date,
            private_subscriptions__coach_compensation_type='external', **({'private_subscriptions__type_id': s_type} if s_type else {})
        ))
    ).values('username', 'total_clients', 'total_attendance', 'total_revenue').order_by('-total_clients')
    
    temporal_stats = base_qs.annotate(month=TruncMonth('start_date')).values('month').annotate(
        total_subscriptions=Count('id'), total_revenue=Sum('paid_amount')
    ).order_by('month')
    
    renewal_filter = {'subscriptions__end_date__lt': end_date, 'subscriptions__start_date__gte': start_date}
    if s_type:
        renewal_filter['subscriptions__type_id'] = s_type
    if coach:
        renewal_filter['subscriptions__coach_id'] = coach
    renewal_stats = SubscriptionType.objects.filter(club=club).annotate(
        expired_subscriptions=Count('subscriptions', filter=Q(**renewal_filter)),
        renewed_subscriptions=Count('subscriptions', filter=Q(
            subscriptions__end_date__lt=end_date, subscriptions__start_date__gte=start_date,
            subscriptions__member__subscription__start_date__gt=F('subscriptions__end_date'),
            subscriptions__member__subscription__start_date__lte=F('subscriptions__end_date') + timedelta(days=30),
            subscriptions__member__subscription__type=F('subscriptions__type'), **({'subscriptions__type_id': s_type} if s_type else {}),
            **({'subscriptions__coach_id': coach} if coach else {})
        ))
    ).annotate(
        renewal_rate=ExpressionWrapper(
            100.0 * F('renewed_subscriptions') / Case(When(expired_subscriptions__gt=0, then=F('expired_subscriptions')), default=Value(1), output_field=FloatField()),
            output_field=FloatField()
        )
    ).values('name', 'expired_subscriptions', 'renewed_subscriptions', 'renewal_rate').order_by('-renewal_rate')
    
    nearing_expiry = Subscription.objects.filter(
        club=club, end_date__range=(today, today + timedelta(days=7)), **({'type_id': s_type} if s_type else {}), **({'coach_id': coach} if coach else {})
    ).order_by('end_date')
    
    response = {
        'popular_subscription_types': list(popular_qs),
        'attendance_analysis': {
            'highest_attendance_types': list(att_stats),
            'by_day_of_week': [
                {'day': ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'][d['day_of_week']], 'total_entries': d['total_entries']}
                for d in att_by_day
            ]
        },
        'freeze_analysis': list(freeze_stats),
        'revenue_analysis': list(revenue_stats),
        'member_behavior': {'active_members': MemberBehaviorSerializer(member_behavior, many=True).data, 'inactive_members': list(inactive_members)},
        'coach_analysis': list(coach_stats),
        'temporal_analysis': [
            {'month': t['month'].strftime('%Y-%m'), 'total_subscriptions': t['total_subscriptions'], 'total_revenue': t['total_revenue'] or 0}
            for t in temporal_stats
        ],
        'renewal_rate_by_type': [
            {'name': r['name'], 'expired_subscriptions': r['expired_subscriptions'], 'renewed_subscriptions': r['renewed_subscriptions'], 'renewal_rate': round(r['renewal_rate'], 2)}
            for r in renewal_stats
        ],
        'nearing_expiry': SubscriptionSerializer(nearing_expiry, many=True).data,
        'date_range': {'start_date': str(start_date), 'end_date': str(end_date)}
    }
    return Response(response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coach_report(request, coach_id):
    """Get report for a specific coach."""
    coach = get_object_or_404(User, pk=coach_id, role='coach', is_active=True)
    
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if coach.club != request.user.club and request.user.role != 'owner':
        return Response({'error': 'غير مخول لعرض تقرير هذا الكابتن'}, status=status.HTTP_403_FORBIDDEN)
    
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    type_id = request.query_params.get('type_id')
    
    try:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else timezone.now().date().replace(day=1)
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else timezone.now().date()
    except ValueError:
        return Response({'error': 'صيغة التاريخ غير صحيحة (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
    
    subscriptions = Subscription.objects.filter(
        coach=coach, club=request.user.club, start_date__lte=end_date, end_date__gte=start_date
    ).select_related('member', 'type').prefetch_related('attendance_attendances')
    
    if type_id:
        try:
            subscriptions = subscriptions.filter(type_id=int(type_id))
        except ValueError:
            return Response({'error': 'معرف نوع الاشتراك غير صحيح'}, status=status.HTTP_400_BAD_REQUEST)
    
    prev_month_end = start_date - timedelta(days=1)
    prev_month_start = prev_month_end.replace(day=1)
    prev_month_clients = Subscription.objects.filter(
        coach=coach, club=request.user.club, start_date__lte=prev_month_end, end_date__gte=prev_month_start
    ).filter(type_id=type_id if type_id else Q()).aggregate(prev_clients=Count('id'))['prev_clients'] or 0
    
    aggregated_data = subscriptions.aggregate(
        active_clients=Count('id', filter=Q(start_date__lte=timezone.now().date(), end_date__gte=timezone.now().date())),
        total_coach_compensation=Sum('coach_compensation_value', filter=Q(coach_compensation_type='external')),
        total_paid_amount=Sum('paid_amount'),
        total_remaining_amount=Sum('remaining_amount')
    )
    
    report = {
        'coach_id': coach.id,
        'coach_username': coach.username,
        'active_clients': aggregated_data['active_clients'] or 0,
        'total_coach_compensation': aggregated_data['total_coach_compensation'] or 0,
        'total_paid_amount': aggregated_data['total_paid_amount'] or 0,
        'total_remaining_amount': aggregated_data['total_remaining_amount'] or 0,
        'previous_month_clients': prev_month_clients,
        'subscriptions': subscriptions,
        'club': request.user.club,
        'start_date': start_date,
        'end_date': end_date
    }
    
    serializer = CoachReportSerializer(report)
    return Response(serializer.data)
