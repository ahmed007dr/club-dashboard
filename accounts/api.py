from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserProfileSerializer, LoginSerializer, RFIDLoginSerializer, UserSerializer
from utils.permissions import IsOwnerOrRelatedToClub
from .models import User
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q


@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    """
    Authenticate a user with username and password, returning user data with permissions and groups.
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        user = authenticate(username=username, password=password)
        
        if user:
            user = User.objects.prefetch_related('groups', 'user_permissions', 'groups__permissions').get(id=user.id)
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserProfileSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    """
    Blacklist a refresh token to log out the user.
    """
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(status=status.HTTP_205_RESET_CONTENT)
    except Exception:
        return Response(status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def api_user_profile(request):
    user = User.objects.prefetch_related('groups', 'user_permissions', 'groups__permissions').get(id=request.user.id)
    serializer = UserProfileSerializer(user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user_list(request):
    """
    List users with search functionality, including new fields (phone_number, card_number).
    Only accessible to users with 'owner' or 'admin' role.
    """
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'غير مسموح بالوصول إلى هذه الصفحة.'}, status=status.HTTP_403_FORBIDDEN)

    search_query = request.query_params.get('search', '').strip()

    if request.user.role == 'owner':
        users = User.objects.prefetch_related('groups', 'user_permissions', 'groups__permissions', 'club').all()
    else:
        users = User.objects.prefetch_related('groups', 'user_permissions', 'groups__permissions', 'club').filter(club=request.user.club)

    if search_query:
        is_active_filter = None
        if search_query.lower() in ['نشط', 'active', 'true', '1']:
            is_active_filter = True
        elif search_query.lower() in ['غير نشط', 'inactive', 'false', '0']:
            is_active_filter = False

        query = (
            Q(username__icontains=search_query) |
            Q(email__icontains=search_query) |
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query) |
            Q(role__icontains=search_query) |
            Q(rfid_code__icontains=search_query) |
            Q(phone_number__icontains=search_query) |
            Q(card_number__icontains=search_query) |
            Q(club__name__icontains=search_query)
        )

        if is_active_filter is not None:
            query &= Q(is_active=is_active_filter)

        users = users.filter(query)

    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(users, request)
    serializer = UserProfileSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_user_create(request):
    """
    Create a new user with roles 'reception', 'coach', or 'accountant' only.
    Only accessible to users with 'owner' or 'admin' role and 'add_user' permission.
    """
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'غير مسموح بالوصول إلى هذه الصفحة.'}, status=status.HTTP_403_FORBIDDEN)

    if not request.user.has_perm('auth.add_user'):
        return Response({'error': 'لا تملك الصلاحية لإنشاء مستخدمين.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def api_user_update(request, pk):
    """
    Update an existing user with roles 'reception', 'coach', or 'accountant' only.
    Only accessible to users with 'owner' or 'admin' role and 'change_user' permission.
    """
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'غير مسموح بالوصول إلى هذه الصفحة.'}, status=status.HTTP_403_FORBIDDEN)

    if not request.user.has_perm('auth.change_user'):
        return Response({'error': 'لا تملك الصلاحية لتعديل مستخدمين.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        if request.user.role == 'owner':
            user = User.objects.get(pk=pk)
        else:
            user = User.objects.get(pk=pk, club=request.user.club)
    except User.DoesNotExist:
        return Response({'error': 'المستخدم غير موجود.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = UserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def api_rfid_login(request):
    """
    Authenticate a user with RFID code, returning user data with permissions and groups.
    """
    serializer = RFIDLoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        user = User.objects.prefetch_related('groups', 'user_permissions', 'groups__permissions').get(id=user.id)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def active_users_api(request):
    try:
        users = User.objects.filter(is_active=True)
        
        if request.user.role != 'owner':
            users = users.filter(club=request.user.club)
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def coach_list(request):
    coaches = User.objects.filter(
        role='coach',
        is_active=True,
        club=request.user.club
    ).values('id', 'username')
    return Response(coaches)