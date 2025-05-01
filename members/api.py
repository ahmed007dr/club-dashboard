from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import MemberSerializer
from .models import Member
from django.shortcuts import get_object_or_404
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def member_list_api(request):
    paginator = PageNumberPagination()
    paginator.page_size = 20
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=401)
    members = Member.objects.all()
    result_page = paginator.paginate_queryset(members, request)
    serializer = MemberSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_member_api(request):
    serializer = MemberSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def member_detail_api(request, member_id):
    member = get_object_or_404(Member, id=member_id)
    serializer = MemberSerializer(member)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_member_api(request, member_id):
    member = get_object_or_404(Member, id=member_id)
    serializer = MemberSerializer(member, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_member_api(request, member_id):
    member = get_object_or_404(Member, id=member_id)
    member.delete()
    return Response(status=204)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def member_search_api(request):
    search_term = request.GET.get('q', '')
    members = Member.objects.filter(
        Q(name__icontains=search_term) |
        Q(membership_number__icontains=search_term)
    )

    serializer = MemberSerializer(members, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user_profile(request):
    user = request.user
    profile_data = {
        'username': user.username,
        'email': user.email,
    }
    return Response(profile_data)
