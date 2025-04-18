from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Shift
from .serializers import ShiftSerializer
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shift_list_api(request):
    shifts = Shift.objects.select_related('club', 'staff', 'approved_by').all()
    serializer = ShiftSerializer(shifts, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_shift_api(request):
    data = request.data.copy()
    if 'approved_by' not in data:
        data['approved_by'] = request.user.id  # Auto-set current user as approver if not specified
    
    serializer = ShiftSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shift_detail_api(request, shift_id):
    shift = get_object_or_404(Shift, id=shift_id)
    serializer = ShiftSerializer(shift)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_shift_api(request, shift_id):
    shift = get_object_or_404(Shift, id=shift_id)
    serializer = ShiftSerializer(shift, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_shift_api(request, shift_id):
    shift = get_object_or_404(Shift, id=shift_id)
    shift.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_shifts_api(request, staff_id):
    shifts = Shift.objects.filter(staff_id=staff_id).select_related('club', 'approved_by')
    serializer = ShiftSerializer(shifts, many=True)
    return Response(serializer.data)