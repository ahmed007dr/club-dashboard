from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Receipt, AutoCorrectionLog
from .serializers import ReceiptSerializer
from subscriptions.models import Subscription, SubscriptionType
from members.models import Member
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub
from finance.models import Income, IncomeSource
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from datetime import datetime, timedelta

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def receipt_list_api(request):
    """List receipts with optional filters."""
    receipts = Receipt.objects.select_related('club', 'member', 'subscription', 'issued_by').filter(
        club=request.user.club
    )
    if request.query_params.get('identifier'):
        receipts = receipts.filter(
            member__in=Member.objects.filter(
                Q(name__icontains=request.query_params.get('identifier')) |
                Q(phone__icontains=request.query_params.get('identifier')) |
                Q(rfid_code__icontains=request.query_params.get('identifier'))
            )
        )
    receipts = receipts.order_by('-date')
    paginator = PageNumberPagination()
    paginated_receipts = paginator.paginate_queryset(receipts, request)
    serializer = ReceiptSerializer(paginated_receipts, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def receipt_detail_api(request, receipt_id):
    """Retrieve details of a specific receipt."""
    receipt = get_object_or_404(Receipt, id=receipt_id, club=request.user.club)
    serializer = ReceiptSerializer(receipt)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def receipt_by_invoice_api(request, invoice_number):
    """Retrieve receipt by invoice number."""
    receipt = get_object_or_404(Receipt, invoice_number=invoice_number, club=request.user.club)
    serializer = ReceiptSerializer(receipt)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_receipt_api(request):
    """Create a new receipt."""
    data = request.data.copy()
    data['issued_by'] = request.user.id
    data['club'] = request.user.club.id
    identifier = data.get('identifier')
    if identifier:
        try:
            member = Member.objects.filter(
                Q(name__icontains=identifier) |
                Q(phone__icontains=identifier) |
                Q(rfid_code__icontains=identifier)
            ).first()
            if not member:
                return Response({'error': 'لم يتم العثور على عضو مطابق للمعرف المقدم'}, status=status.HTTP_400_BAD_REQUEST)
            data['member'] = member.id
        except Member.DoesNotExist:
            return Response({'error': 'لم يتم العثور على عضو مطابق للمعرف المقدم'}, status=status.HTTP_400_BAD_REQUEST)
    serializer = ReceiptSerializer(data=data)
    if serializer.is_valid():
        receipt = serializer.save()
        source_name = 'Subscription Payment' if receipt.subscription else 'General Payment'
        source, _ = IncomeSource.objects.get_or_create(club=receipt.club, name=source_name)
        Income.objects.create(
            club=receipt.club, source=source, amount=receipt.amount, date=receipt.date.date(),
            received_by=receipt.issued_by, related_receipt=receipt
        )
        if not receipt.invoice_number:
            today_str = timezone.now().strftime('%Y%m%d')
            invoice_id = f"INV{today_str}-{receipt.id:04d}"
            receipt.invoice_number = invoice_id
            receipt.save(update_fields=['invoice_number'])
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def edit_receipt_api(request, receipt_id):
    """Update a receipt (Owner or Admin only)."""
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'غير مسموح بالتعديل. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    receipt = get_object_or_404(Receipt, id=receipt_id, club=request.user.club)
    serializer = ReceiptSerializer(receipt, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_receipt_api(request, receipt_id):
    """Delete a receipt (Owner or Admin only)."""
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'غير مسموح بالحذف. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    receipt = get_object_or_404(Receipt, id=receipt_id, club=request.user.club)
    receipt.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def validate_or_autocorrect_receipt(request):
    """Validate or autocorrect a receipt."""
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'غير مسموح بالتحقق أو التصحيح التلقائي. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    data = request.data
    member_id = data.get('member')
    subscription_id = data.get('subscription')
    amount = data.get('amount')
    default_subscription_type_name = data.get('default_subscription_type')
    try:
        member = Member.objects.get(id=member_id)
    except Member.DoesNotExist:
        return Response({"error": "العضو غير موجود."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        subscription = Subscription.objects.get(id=subscription_id)
    except Subscription.DoesNotExist:
        subscription = None
    if subscription and subscription.member.id == member.id:
        return Response({"message": "التحقق ناجح. يمكنك المتابعة."}, status=status.HTTP_200_OK)
    active_subscriptions = Subscription.objects.filter(member=member, end_date__gte=datetime.today()).order_by('end_date')
    if active_subscriptions.exists():
        correct_subscription = active_subscriptions.first()
        AutoCorrectionLog.objects.create(
            member=member, old_subscription=subscription, new_subscription=correct_subscription,
            note="تم التصحيح التلقائي إلى اشتراك نشط."
        )
        return Response({
            "error": "الاشتراك المقدم غير صحيح.",
            "auto_corrected_subscription": {
                "id": correct_subscription.id, "type": correct_subscription.type.name,
                "start_date": correct_subscription.start_date, "end_date": correct_subscription.end_date,
                "paid_amount": correct_subscription.paid_amount, "remaining_amount": correct_subscription.remaining_amount,
            },
            "tip": "تم العثور على اشتراك نشط. تم تطبيق التصحيح التلقائي."
        }, status=status.HTTP_200_OK)
    if not default_subscription_type_name:
        return Response({"error": "لم يتم العثور على اشتراكات نشطة. يرجى تقديم 'default_subscription_type'."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        default_type = SubscriptionType.objects.get(name=default_subscription_type_name)
    except SubscriptionType.DoesNotExist:
        return Response({"error": f"نوع الاشتراك '{default_subscription_type_name}' غير موجود."}, status=status.HTTP_400_BAD_REQUEST)
    today = datetime.today().date()
    end_date = today + timedelta(days=default_type.duration_days)
    paid_amount = amount or default_type.price
    remaining_amount = max(default_type.price - paid_amount, 0)
    new_subscription = Subscription.objects.create(
        club=member.club, member=member, type=default_type, start_date=today, end_date=end_date,
        paid_amount=paid_amount, remaining_amount=remaining_amount
    )
    AutoCorrectionLog.objects.create(
        member=member, old_subscription=subscription, new_subscription=new_subscription,
        note="تم إنشاء اشتراك جديد تلقائيًا لعدم وجود اشتراكات نشطة."
    )
    return Response({
        "error": "الاشتراك المقدم غير صالح.",
        "auto_created_subscription": {
            "id": new_subscription.id, "type": new_subscription.type.name,
            "start_date": new_subscription.start_date, "end_date": new_subscription.end_date,
            "paid_amount": new_subscription.paid_amount, "remaining_amount": new_subscription.remaining_amount,
        },
        "tip": "لم يتم العثور على اشتراكات نشطة. تم إنشاء اشتراك جديد تلقائيًا."
    }, status=status.HTTP_201_CREATED)