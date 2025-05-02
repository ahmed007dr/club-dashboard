from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Receipt,AutoCorrectionLog
from subscriptions.models import Subscription , SubscriptionType
from members.models import Member
from .serializers import ReceiptSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub  

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def receipt_list_api(request):
    if request.user.role == 'owner':
        receipts = Receipt.objects.select_related('club', 'member', 'subscription', 'issued_by').all()  
    else:
        receipts = Receipt.objects.select_related('club', 'member', 'subscription', 'issued_by').filter(club=request.user.club)  

    serializer = ReceiptSerializer(receipts, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_receipt_api(request):
    data = request.data.copy()
    data['issued_by'] = request.user.id  
    
    serializer = ReceiptSerializer(data=data)
    if serializer.is_valid():
        receipt = serializer.save()

        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, receipt):
            receipt.delete()  
            return Response({'error': 'You do not have permission to create a receipt for this club'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def receipt_detail_api(request, receipt_id):
    receipt = get_object_or_404(Receipt, id=receipt_id)

    serializer = ReceiptSerializer(receipt)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def edit_receipt_api(request, receipt_id):
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
    receipt = get_object_or_404(Receipt, id=receipt_id)

    receipt.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def receipt_by_invoice_api(request, invoice_number):
    receipt = get_object_or_404(Receipt, invoice_number=invoice_number)

    serializer = ReceiptSerializer(receipt)
    return Response(serializer.data)

from datetime import datetime, timedelta

@api_view(['POST'])
def validate_or_autocorrect_receipt(request):
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
