from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status, generics
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate 
from .serializers import UserProfileSerializer, LoginSerializer, RFIDLoginSerializer, UserSerializer
from utils.permissions import IsOwnerOrRelatedToClub
from .models import User
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.contrib.auth.models import Permission

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

class UserListCreateView(generics.ListCreateAPIView):
    """
    List all users with search functionality and create new users.
    Only accessible to admin or owner with appropriate permissions.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrRelatedToClub]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        search_query = self.request.query_params.get('search', '').strip()
        if self.request.user.role == 'owner':
            users = User.objects.prefetch_related('groups', 'user_permissions', 'groups__permissions', 'club').all()
        else:
            users = User.objects.prefetch_related('groups', 'user_permissions', 'groups__permissions', 'club').filter(club=self.request.user.club)

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

        return users

    def perform_create(self, serializer):
        # Ensure only admin or owner can create users
        if not self.request.user.has_perm('auth.add_user'):
            raise PermissionDenied("You do not have permission to create users.")
        serializer.save()

class UserUpdateView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update user details.
    Only accessible to admin or owner with appropriate permissions.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrRelatedToClub]

    def get_queryset(self):
        if self.request.user.role == 'owner':
            return User.objects.all()
        return User.objects.filter(club=self.request.user.club)

    def perform_update(self, serializer):
        # Ensure only admin or owner can update users
        if not self.request.user.has_perm('auth.change_user'):
            raise PermissionDenied("You do not have permission to update users.")
        serializer.save()

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