from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Receipt
from .serializers import ReceiptSerializer
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def receipt_list_api(request):
    receipts = Receipt.objects.select_related('club', 'member', 'subscription', 'issued_by').all()
    serializer = ReceiptSerializer(receipts, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_receipt_api(request):
    data = request.data.copy()
    data['issued_by'] = request.user.id  # Auto-set the current user as issued_by
    
    serializer = ReceiptSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def receipt_detail_api(request, receipt_id):
    receipt = get_object_or_404(Receipt, id=receipt_id)
    serializer = ReceiptSerializer(receipt)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_receipt_api(request, receipt_id):
    receipt = get_object_or_404(Receipt, id=receipt_id)
    serializer = ReceiptSerializer(receipt, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_receipt_api(request, receipt_id):
    receipt = get_object_or_404(Receipt, id=receipt_id)
    receipt.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def receipt_by_invoice_api(request, invoice_number):
    receipt = get_object_or_404(Receipt, invoice_number=invoice_number)
    serializer = ReceiptSerializer(receipt)
    return Response(serializer.data)