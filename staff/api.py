from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Shift
from .serializers import ShiftSerializer
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub  

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def shift_list_api(request):
    if request.user.role == 'owner':
        shifts = Shift.objects.select_related('club', 'staff', 'approved_by').all()  
    else:
        shifts = Shift.objects.select_related('club', 'staff', 'approved_by').filter(club=request.user.club)  

    serializer = ShiftSerializer(shifts, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def add_shift_api(request):
    data = request.data.copy()
    if 'approved_by' not in data:
        data['approved_by'] = request.user.id  
    
    serializer = ShiftSerializer(data=data)
    if serializer.is_valid():
        shift = serializer.save()

        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, shift):
            shift.delete() 
            return Response({'error': 'You do not have permission to create a shift for this club'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def shift_detail_api(request, shift_id):
    shift = get_object_or_404(Shift, id=shift_id)

    serializer = ShiftSerializer(shift)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def edit_shift_api(request, shift_id):
    shift = get_object_or_404(Shift, id=shift_id)

    serializer = ShiftSerializer(shift, data=request.data, partial=True)
    if serializer.is_valid():
        updated_shift = serializer.save()
        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, updated_shift):
            return Response({'error': 'You do not have permission to update this shift to this club'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_shift_api(request, shift_id):
    shift = get_object_or_404(Shift, id=shift_id)

    shift.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def staff_shifts_api(request, staff_id):

    if request.user.role == 'owner':
        shifts = Shift.objects.filter(staff_id=staff_id).select_related('club', 'approved_by')  
    else:
        shifts = Shift.objects.filter(staff_id=staff_id, club=request.user.club).select_related('club', 'approved_by')  

    serializer = ShiftSerializer(shifts, many=True)
    return Response(serializer.data)