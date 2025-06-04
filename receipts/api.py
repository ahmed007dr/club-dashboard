from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Receipt, AutoCorrectionLog
from subscriptions.models import Subscription, SubscriptionType
from members.models import Member
from .serializers import ReceiptSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub
from finance.models import Income, IncomeSource
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from staff.models import StaffAttendance
from datetime import datetime, timedelta

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def receipt_list_api(request):
    identifier = request.query_params.get('identifier', None)
    is_search_mode = bool(identifier)  # Consider it a search if identifier is provided

    if request.user.role in ['owner', 'admin']:
        receipts = Receipt.objects.select_related('club', 'member', 'subscription', 'issued_by').filter(
            club=request.user.club
        )
    else:
        if is_search_mode:
            # Allow access to all receipts for search queries
            receipts = Receipt.objects.select_related('club', 'member', 'subscription', 'issued_by').filter(
                club=request.user.club
            )
        else:
            # Restrict to receipts issued by the user in current shift
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True  # Current open shift
            ).order_by('-check_in').first()

            if not attendance:
                return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

            receipts = Receipt.objects.select_related('club', 'member', 'subscription', 'issued_by').filter(
                club=request.user.club,
                issued_by=request.user,
                date__gte=attendance.check_in,
                date__lte=timezone.now()
            )

    if identifier:
        receipts = receipts.filter(
            member__in=Member.objects.filter(
                Q(name__icontains=identifier) |
                Q(phone__icontains=identifier) |
                Q(rfid_code__icontains=identifier)
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
    receipt = get_object_or_404(Receipt, id=receipt_id)
    identifier = request.query_params.get('identifier', None)
    is_search_mode = bool(identifier)  # Consider it a search if identifier is provided

    if request.user.role not in ['owner', 'admin'] and not is_search_mode:
        # Restrict to receipts issued by the user in current shift
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

        if receipt.issued_by != request.user or receipt.date < attendance.check_in or receipt.date > timezone.now():
            return Response({'error': 'This receipt is not associated with your current shift.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = ReceiptSerializer(receipt)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def receipt_by_invoice_api(request, invoice_number):
    receipt = get_object_or_404(Receipt, invoice_number=invoice_number)
    is_search_mode = True  # Treat invoice number lookup as a search query

    if request.user.role not in ['owner', 'admin'] and not is_search_mode:
        # Restrict to receipts issued by the user in current shift
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

        if receipt.issued_by != request.user or receipt.date < attendance.check_in or receipt.date > timezone.now():
            return Response({'error': 'This receipt is not associated with your current shift.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = ReceiptSerializer(receipt)
    return Response(serializer.data)

# باقي الـ APIs بدون تغيير
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_receipt_api(request):
    if request.user.role not in ['owner', 'admin']:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'You can only add receipts during an active shift.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data.copy()
    data['issued_by'] = request.user.id

    identifier = data.get('identifier')

    if identifier:
        try:
            member = Member.objects.filter(
                Q(name__icontains=identifier) |
                Q(phone__icontains=identifier) |
                Q(rfid_code__icontains=identifier)
            ).first()
            if not member:
                return Response({'error': 'No member found matching the provided identifier'}, status=status.HTTP_400_BAD_REQUEST)
            data['member'] = member.id
        except Member.DoesNotExist:
            return Response({'error': 'No member found matching the provided identifier'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = ReceiptSerializer(data=data)
    if serializer.is_valid():
        receipt = serializer.save()

        source_name = 'Subscription Payment' if receipt.subscription else 'General Payment'
        source, _ = IncomeSource.objects.get_or_create(club=receipt.club, name=source_name)

        Income.objects.create(
            club=receipt.club,
            source=source,
            amount=receipt.amount,
            date=receipt.date.date(),
            received_by=receipt.issued_by,
            related_receipt=receipt
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
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'Only owners or admins can edit receipts.'}, status=status.HTTP_403_FORBIDDEN)

    receipt = get_object_or_404(Receipt, id=receipt_id)
    serializer = ReceiptSerializer(receipt, data=request.data, partial=True)
    if serializer.is_valid():
        updated_receipt = serializer.save()
        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, updated_receipt):
            return Response({'error': 'You do not have permission to update this receipt to this club'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_receipt_api(request, receipt_id):
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'Only owners or admins can delete receipts.'}, status=status.HTTP_403_FORBIDDEN)

    receipt = get_object_or_404(Receipt, id=receipt_id)
    receipt.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def validate_or_autocorrect_receipt(request):
    if request.user.role not in ['owner', 'admin']:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'You can only validate receipts during an active shift.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data

    member_id = data.get('member')
    subscription_id = data.get('subscription')
    amount = data.get('amount')
    default_subscription_type_name = data.get('default_subscription_type')

    try:
        member = Member.objects.get(id=member_id)
    except Member.DoesNotExist:
        return Response({"error": "Member does not exist."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        subscription = Subscription.objects.get(id=subscription_id)
    except Subscription.DoesNotExist:
        subscription = None

    if subscription and subscription.member.id == member.id:
        return Response({"message": "Validation successful. Proceed."}, status=status.HTTP_200_OK)

    active_subscriptions = Subscription.objects.filter(
        member=member,
        end_date__gte=datetime.today()
    ).order_by('end_date')

    if active_subscriptions.exists():
        correct_subscription = active_subscriptions.first()

        AutoCorrectionLog.objects.create(
            member=member,
            old_subscription=subscription,
            new_subscription=correct_subscription,
            note="Auto-corrected to an active subscription."
        )

        return Response({
            "error": "The provided subscription was incorrect.",
            "auto_corrected_subscription": {
                "id": correct_subscription.id,
                "type": correct_subscription.type.name,
                "start_date": correct_subscription.start_date,
                "end_date": correct_subscription.end_date,
                "paid_amount": correct_subscription.paid_amount,
                "remaining_amount": correct_subscription.remaining_amount,
            },
            "tip": "We found an active subscription. Auto-correction applied."
        }, status=status.HTTP_200_OK)

    if not default_subscription_type_name:
        return Response({"error": "No active subscriptions found. Please provide 'default_subscription_type'."},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        default_type = SubscriptionType.objects.get(name=default_subscription_type_name)
    except SubscriptionType.DoesNotExist:
        return Response({"error": f"SubscriptionType '{default_subscription_type_name}' not found."},
                        status=status.HTTP_400_BAD_REQUEST)

    today = datetime.today().date()
    end_date = today + timedelta(days=default_type.duration_days)

    paid_amount = amount or default_type.price
    remaining_amount = max(default_type.price - paid_amount, 0)

    new_subscription = Subscription.objects.create(
        club=member.club,
        member=member,
        type=default_type,
        start_date=today,
        end_date=end_date,
        paid_amount=paid_amount,
        remaining_amount=remaining_amount,
    )

    AutoCorrectionLog.objects.create(
        member=member,
        old_subscription=subscription,
        new_subscription=new_subscription,
        note="Auto-created new subscription due to no active ones."
    )

    return Response({
        "error": "The provided subscription was invalid.",
        "auto_created_subscription": {
            "id": new_subscription.id,
            "type": new_subscription.type.name,
            "start_date": new_subscription.start_date,
            "end_date": new_subscription.end_date,
            "paid_amount": new_subscription.paid_amount,
            "remaining_amount": new_subscription.remaining_amount,
        },
        "tip": "No active subscriptions found. A new subscription has been created automatically."
    }, status=status.HTTP_201_CREATED)