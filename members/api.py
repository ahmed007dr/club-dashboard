from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import MemberSerializer
from .models import Member
from django.shortcuts import get_object_or_404

@api_view(['GET'])
def member_list_api(request):
    members = Member.objects.all()
    serializer = MemberSerializer(members, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def create_member_api(request):
    serializer = MemberSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
def member_detail_api(request, member_id):
    member = get_object_or_404(Member, id=member_id)
    serializer = MemberSerializer(member)
    return Response(serializer.data)

@api_view(['PUT'])
def update_member_api(request, member_id):
    member = get_object_or_404(Member, id=member_id)
    serializer = MemberSerializer(member, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
def delete_member_api(request, member_id):
    member = get_object_or_404(Member, id=member_id)
    member.delete()
    return Response(status=204)

@api_view(['GET'])
def member_search_api(request):
    search_term = request.GET.get('q', '')
    members = Member.objects.filter(
        models.Q(name__icontains=search_term) |
        models.Q(membership_number__icontains=search_term)
    )
    serializer = MemberSerializer(members, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def api_user_profile(request):
    user = request.user
    # Add your user profile serialization logic here
    return Response({'username': user.username, 'email': user.email})