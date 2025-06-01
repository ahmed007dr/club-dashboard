from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from utils.permissions import IsOwnerOrRelatedToClub  
from .serializers import MemberSerializer
from .models import Member
from utils.generate_membership_number import generate_membership_number
from django.db import IntegrityError
from staff.models import StaffAttendance
from django.utils import timezone
from attendance.models import Attendance 


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def member_list_api(request):
    search_term = request.GET.get('q', '')
    
    if request.user.role in ['owner', 'admin']:
        members = Member.objects.filter(club=request.user.club).order_by('-id')
    else:
        # الموظف يشوف الأعضاء اللي ليهم حضور في الشيفت بتاعه
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'No open or recent shift found.'}, status=status.HTTP_404_NOT_FOUND)

        check_out = attendance.check_out if attendance.check_out else timezone.now()
        member_ids = Attendance.objects.filter(
            subscription__club=request.user.club,
            attendance_date__range=(attendance.check_in, check_out)
        ).values_list('subscription__member_id', flat=True).distinct()

        members = Member.objects.filter(
            id__in=member_ids,
            club=request.user.club
        ).order_by('-id')

    if search_term:
        members = members.filter(
            Q(name__icontains=search_term) |
            Q(phone__icontains=search_term) |
            Q(rfid_code__icontains=search_term)
        )
    
    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(members, request)
    serializer = MemberSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data) 


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def member_search_api(request):
    search_term = request.GET.get('q', '')

    search_filter = (
        Q(name__icontains=search_term) |
        Q(membership_number__icontains=search_term) |
        Q(national_id__icontains=search_term) |
        Q(rfid_code__icontains=search_term) |
        Q(phone__icontains=search_term)
    )

    members = Member.objects.filter(
        Q(club=request.user.club) & search_filter
    ).order_by('-id')

    paginator = PageNumberPagination()
    result_page = paginator.paginate_queryset(members, request)
    serializer = MemberSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user_profile(request):
    user = request.user
    profile_data = {
        'username': user.username,
        'email': user.email,
    }
    return Response(profile_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def create_member_api(request):
    if request.user.role not in ['owner', 'admin']:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club
        ).order_by('-check_in').first()

        if not attendance or (attendance.check_out and attendance.check_out < timezone.now()):
            return Response({'error': 'You can only create members during an active shift.'}, status=status.HTTP_403_FORBIDDEN)

    membership_number = generate_membership_number()
    data = request.data.copy()
    data['membership_number'] = membership_number  

    serializer = MemberSerializer(data=data, context={'request': request})

    if serializer.is_valid():
        try:
            member = serializer.save()
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, member):
                member.delete()
                return Response({'error': 'You do not have permission to create a member for this club'}, status=status.HTTP_403_FORBIDDEN)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response({'error': 'Membership number or RFID code already exists'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Error uploading file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def member_detail_api(request, member_id):
    member = get_object_or_404(Member, id=member_id)
    if request.user.role not in ['owner', 'admin']:
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club
        ).order_by('-check_in').first()

        if not attendance:
            return Response({'error': 'No open or recent shift found.'}, status=status.HTTP_404_NOT_FOUND)

        check_out = attendance.check_out if attendance.check_out else timezone.now()
        has_interaction = Attendance.objects.filter(
            subscription__club=request.user.club,
            subscription__member_id=member_id,
            attendance_date__range=(attendance.check_in, check_out)
        ).exists()

        if not has_interaction:
            return Response({'error': 'This member is not associated with your current shift.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = MemberSerializer(member)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def update_member_api(request, member_id):
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'Only owners or admins can update members.'}, status=status.HTTP_403_FORBIDDEN)

    member = get_object_or_404(Member, id=member_id)
    serializer = MemberSerializer(member, data=request.data)
    if serializer.is_valid():
        updated_member = serializer.save()
        if not IsOwnerOrRelatedToClub().has_object_permission(request, None, updated_member):
            return Response({'error': 'You do not have permission to update this member to this club'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def delete_member_api(request, member_id):
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'Only owners or admins can delete members.'}, status=status.HTTP_403_FORBIDDEN)

    member = get_object_or_404(Member, id=member_id)
    member.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)