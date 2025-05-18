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


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_type_list(request):
    print("تم تنفيذ خطوة: بدء معالجة طلب subscription_type_list")
    
    if request.method == 'GET':
        print("تم تنفيذ خطوة: التحقق من أن الطلب هو GET")
        search_term = request.GET.get('q', '')
        print(f"تم تنفيذ خطوة: جلب search_term = {search_term}")

        if request.user.role == 'owner':
            types = SubscriptionType.objects.all().order_by('id')
            print("تم تنفيذ خطوة: جلب كل أنواع الاشتراكات لصاحب النظام")
        else:
            types = SubscriptionType.objects.filter(club=request.user.club)
            print(f"تم تنفيذ خطوة: جلب أنواع الاشتراكات لنادي المستخدم {request.user.club}")

        # Apply search filter
        if search_term:
            types = types.filter(
                Q(name__icontains=search_term)
            )
            print("تم تنفيذ خطوة: تطبيق فلتر البحث")

        types = types.order_by('id')
        print("تم تنفيذ خطوة: ترتيب أنواع الاشتراكات حسب id")
        
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(types, request)
        print("تم تنفيذ خطوة: تطبيق الـ pagination")
        
        serializer = SubscriptionTypeSerializer(page, many=True)
        print("تم تنفيذ خطوة: تحويل البيانات إلى JSON باستخدام serializer")
        
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        print("تم تنفيذ خطوة: التحقق من أن الطلب هو POST")
        serializer = SubscriptionTypeSerializer(data=request.data, context={'request': request})
        print("تم تنفيذ خطوة: إنشاء serializer لبيانات نوع الاشتراك")
        
        if serializer.is_valid():
            print("تم تنفيذ خطوة: التحقق من صحة بيانات الـ serializer")
            subscription_type = serializer.save()
            print("تم تنفيذ خطوة: حفظ نوع الاشتراك في قاعدة البيانات")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print("تم تنفيذ خطوة: فشل التحقق من صحة الـ serializer")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def subscription_list(request):
    print("تم تنفيذ خطوة: بدء معالجة طلب subscription_list")
    
    if request.method == 'GET':
        print("تم تنفيذ خطوة: التحقق من أن الطلب هو GET")
        search_term = request.GET.get('identifier', '')
        print(f"تم تنفيذ خطوة: جلب search_term = {search_term}")

        if request.user.role == 'owner':
            subscriptions = Subscription.objects.select_related('member', 'type', 'club').all().order_by('-start_date')
            print("تم تنفيذ خطوة: جلب كل الاشتراكات لصاحب النظام")
        else:
            subscriptions = Subscription.objects.select_related('member', 'type', 'club').filter(club=request.user.club).order_by('-start_date')
            print(f"تم تنفيذ خطوة: جلب الاشتراكات لنادي المستخدم {request.user.club}")

        # Apply search filter
        if search_term:
            subscriptions = subscriptions.filter(
                Q(member__name__icontains=search_term) |
                Q(member__phone__icontains=search_term) |
                Q(member__rfid_code__icontains=search_term)
            )
            print("تم تنفيذ خطوة: تطبيق فلتر البحث")

        # Apply existing filters
        member_id = request.query_params.get('member')
        type_id = request.query_params.get('type')
        club_id = request.query_params.get('club')
        
        if member_id:
            subscriptions = subscriptions.filter(member_id=member_id)
            print(f"تم تنفيذ خطوة: تطبيق فلتر member_id = {member_id}")
        if type_id:
            subscriptions = subscriptions.filter(type_id=type_id)
            print(f"تم تنفيذ خطوة: تطبيق فلتر type_id = {type_id}")
        if club_id:
            subscriptions = subscriptions.filter(club_id=club_id)
            print(f"تم تنفيذ خطوة: تطبيق فلتر club_id = {club_id}")
            
        subscriptions = subscriptions.order_by('-start_date')
        print("تم تنفيذ خطوة: ترتيب الاشتراكات حسب start_date")

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(subscriptions, request)
        print("تم تنفيذ خطوة: تطبيق الـ pagination")
        
        serializer = SubscriptionSerializer(page, many=True)
        print("تم تنفيذ خطوة: تحويل البيانات إلى JSON باستخدام serializer")
        
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        print("تم تنفيذ خطوة: التحقق من أن الطلب هو POST")
        serializer = SubscriptionSerializer(data=request.data, context={'request': request})
        print("تم تنفيذ خطوة: إنشاء serializer لبيانات الاشتراك")
        
        if serializer.is_valid():
            print("تم تنفيذ خطوة: التحقق من صحة بيانات الـ serializer")
            subscription = serializer.save()
            print("تم تنفيذ خطوة: حفظ الاشتراك في قاعدة البيانات")
            
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
                subscription.delete()
                print("تم تنفيذ خطوة: حذف الاشتراك بسبب عدم وجود صلاحية")
                return Response({'error': 'You do not have permission to create a subscription for this club'}, status=status.HTTP_403_FORBIDDEN)
            
            if subscription.paid_amount > 0:
                source, created = IncomeSource.objects.get_or_create(
                    club=subscription.club,
                    name='Subscription',
                    defaults={'description': 'ايراد عن اشتراك'}
                )
                print("تم تنفيذ خطوة: إنشاء أو جلب مصدر الإيراد")
                
                income = Income(
                    club=subscription.club,
                    source=source,
                    amount=subscription.paid_amount,
                    description=f"ايراد اشتراك عن اللاعب  {subscription.member.name}",
                    date=timezone.now().date(),
                    received_by=request.user
                )
                income.save()
                print("تم تنفيذ خطوة: حفظ الإيراد في قاعدة البيانات")

            subscription.remaining_amount = subscription.type.price - subscription.paid_amount
            subscription.save()
            print("تم تنفيذ خطوة: تحديث المبلغ المتبقي وحفظ الاشتراك")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print("تم تنفيذ خطوة: فشل التحقق من صحة الـ serializer")
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
    print("تم تنفيذ خطوة: بدء معالجة طلب subscription_detail")
    
    subscription = get_object_or_404(Subscription, pk=pk)
    print(f"تم تنفيذ خطوة: جلب الاشتراك بـ ID = {pk}")

    if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
        print("تم تنفيذ خطوة: فشل التحقق من الصلاحيات للوصول إلى الاشتراك")
        return Response({'error': 'You do not have permission to access this subscription'}, status=status.HTTP_403_FORBIDDEN)
    print("تم تنفيذ خطوة: التحقق من الصلاحيات بنجاح")

    if request.method == 'GET':
        print("تم تنفيذ خطوة: التحقق من أن الطلب هو GET")
        serializer = SubscriptionSerializer(subscription)
        print("تم تنفيذ خطوة: تحويل بيانات الاشتراك إلى JSON باستخدام serializer")
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        print("تم تنفيذ خطوة: التحقق من أن الطلب هو PUT")
        serializer = SubscriptionSerializer(subscription, data=request.data, partial=True, context={'request': request})
        print("تم تنفيذ خطوة: إنشاء serializer لتحديث بيانات الاشتراك")
        
        if serializer.is_valid():
            print("تم تنفيذ خطوة: التحقق من صحة بيانات الـ serializer")
            updated_subscription = serializer.save()
            print("تم تنفيذ خطوة: حفظ التغييرات على الاشتراك")
            
            updated_subscription.remaining_amount = updated_subscription.type.price - updated_subscription.paid_amount
            updated_subscription.save()
            print(f"تم تنفيذ خطوة: تحديث المبلغ المتبقي = {updated_subscription.remaining_amount} وحفظ الاشتراك")
            
            return Response(serializer.data)
        print("تم تنفيذ خطوة: فشل التحقق من صحة الـ serializer")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        print("تم تنفيذ خطوة: التحقق من أن الطلب هو DELETE")
        subscription.delete()
        print("تم تنفيذ خطوة: حذف الاشتراك من قاعدة البيانات")
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
    print("تم تنفيذ خطوة: بدء معالجة طلب renew_subscription")
    
    subscription = get_object_or_404(Subscription, pk=pk)
    print(f"تم تنفيذ خطوة: جلب الاشتراك بـ ID = {pk}")

    if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
        print("تم تنفيذ خطوة: فشل التحقق من الصلاحيات لتجديد الاشتراك")
        return Response({'error': 'You do not have permission to renew this subscription'}, status=status.HTTP_403_FORBIDDEN)
    print("تم تنفيذ خطوة: التحقق من الصلاحيات بنجاح")

    new_end_date = subscription.end_date + timedelta(days=subscription.type.duration_days)
    print(f"تم تنفيذ خطوة: حساب تاريخ انتهاء جديد = {new_end_date}")
    
    subscription.end_date = new_end_date
    subscription.paid_amount = subscription.type.price
    subscription.remaining_amount = 0
    subscription.entry_count = 0  # Reset entry count on renewal
    subscription.save()
    print("تم تنفيذ خطوة: تحديث بيانات الاشتراك وحفظها")

    source, created = IncomeSource.objects.get_or_create(
        club=subscription.club,
        name='Renewal',
        defaults={'description': 'ايراد عن تجديد اشتراك'}
    )
    print(f"تم تنفيذ خطوة: إنشاء أو جلب مصدر الإيراد 'Renewal'، created = {created}")

    income = Income(
        club=subscription.club,
        source=source,
        amount=subscription.type.price,
        description=f"تجديد اشتراك عن المشترك {subscription.member.name}",
        date=timezone.now().date(),
        received_by=request.user
    )
    income.save()
    print("تم تنفيذ خطوة: إنشاء وحفظ سجل الإيراد")

    serializer = SubscriptionSerializer(subscription)
    print("تم تنفيذ خطوة: تحويل بيانات الاشتراك إلى JSON باستخدام serializer")

    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def make_payment(request, pk):
    print("تم تنفيذ خطوة: بدء معالجة طلب make_payment")
    
    subscription = get_object_or_404(Subscription, pk=pk)
    print(f"تم تنفيذ خطوة: جلب الاشتراك بـ ID = {pk}")

    if not IsOwnerOrRelatedToClub().has_object_permission(request, None, subscription):
        print("تم تنفيذ خطوة: فشل التحقق من الصلاحيات لإجراء الدفع")
        return Response({'error': 'You do not have permission to make a payment for this subscription'}, status=status.HTTP_403_FORBIDDEN)
    print("تم تنفيذ خطوة: التحقق من الصلاحيات بنجاح")

    if subscription.remaining_amount <= 0:
        print("تم تنفيذ خطوة: فشل الدفع لأن المبلغ المتبقي صفر أو أقل")
        return Response({"error": "No remaining amount to pay for this subscription"}, status=status.HTTP_400_BAD_REQUEST)
    print(f"تم تنفيذ خطوة: التحقق من وجود مبلغ متبقي = {subscription.remaining_amount}")

    amount = Decimal(request.data.get('amount', 0))
    print(f"تم تنفيذ خطوة: جلب مبلغ الدفع = {amount}")

    if amount <= 0:
        print("تم تنفيذ خطوة: فشل الدفع لأن المبلغ غير إيجابي")
        return Response({"error": "Payment amount must be positive"}, status=status.HTTP_400_BAD_REQUEST)
    print("تم تنفيذ خطوة: التحقق من أن المبلغ إيجابي")

    if amount > subscription.remaining_amount:
        print(f"تم تنفيذ خطوة: فشل الدفع لأن المبلغ يتجاوز المتبقي {subscription.remaining_amount}")
        return Response({"error": f"Payment amount cannot exceed the remaining amount of {subscription.remaining_amount}"}, status=status.HTTP_400_BAD_REQUEST)
    print("تم تنفيذ خطوة: التحقق من أن المبلغ لا يتجاوز المتبقي")

    subscription.paid_amount += amount
    subscription.remaining_amount = max(Decimal('0'), subscription.type.price - subscription.paid_amount)
    subscription.save()
    print(f"تم تنفيذ خطوة: تحديث المبلغ المدفوع والمتبقي وحفظ الاشتراك")

    source, created = IncomeSource.objects.get_or_create(
        club=subscription.club,
        name='Subscription',
        defaults={'description': 'ايراد عن اشتراك'}
    )
    print(f"تم تنفيذ خطوة: إنشاء أو جلب مصدر الإيراد 'Subscription'، created = {created}")

    income = Income(
        club=subscription.club,
        source=source,
        amount=amount,
        description=f"ايراد عن اشتراك باسم {subscription.member.name}",
        date=timezone.now().date(),
        received_by=request.user
    )
    income.save()
    print("تم تنفيذ خطوة: إنشاء وحفظ سجل الإيراد")

    serializer = SubscriptionSerializer(subscription)
    print("تم تنفيذ خطوة: تحويل بيانات الاشتراك إلى JSON باستخدام serializer")

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