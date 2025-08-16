import logging
from datetime import datetime

from django.db.models import Q,Sum
from django.utils import timezone
from django.contrib.auth import authenticate

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination
from decimal import Decimal

from accounts.models import User
from accounts.serializers import (
    UserProfileSerializer,
    LoginSerializer,
    RFIDLoginSerializer,
    UserSerializer
)

from staff.models import StaffAttendance

from finance.models import Expense, Income, StockTransaction
from finance.serializers import ExpenseSerializer, IncomeSerializer

logger = logging.getLogger(__name__)

FULL_ACCESS_ROLES = ['owner', 'admin']

@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    """Login user, record attendance, and return JWT tokens."""
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
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def api_rfid_login(request):
    """Login user via RFID and record attendance."""
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    """Logout user by blacklisting refresh token."""
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
@permission_classes([IsAuthenticated])
def api_user_profile(request):
    """Retrieve the authenticated user's profile without permission checks."""
    user = User.objects.prefetch_related('groups', 'user_permissions', 'groups__permissions').get(id=request.user.id)
    serializer = UserProfileSerializer(user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user_list(request):
    """Retrieve a list of users from the same club."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'لا يوجد نادي مرتبط بك'}, status=status.HTTP_400_BAD_REQUEST)

    search_query = request.query_params.get('search', '').strip()
    users = User.objects.prefetch_related('groups', 'user_permissions', 'groups__permissions', 'club').filter(
        club=request.user.club
    )

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
            Q(rfid_code__iexact=search_query) |
            Q(phone_number__iexact=search_query) |
            Q(card_number__icontains=search_query)
        )

        if is_active_filter is not None:
            query &= Q(is_active=is_active_filter)

        users = users.filter(query)
        logger.debug(f"Search query: {search_query}, Result count: {users.count()}")

    users = users.order_by('-date_joined')
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(users, request)
    serializer = UserProfileSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_user_create(request):
    """Create a new user."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'لا يوجد نادي مرتبط بك'}, status=status.HTTP_400_BAD_REQUEST)
    
    data = request.data.copy()
    data['club'] = request.user.club.id
    serializer = UserSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def api_user_update(request, pk):
    """Update an existing user (Owner/Admin only)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'لا يوجد نادي مرتبط بك'}, status=status.HTTP_400_BAD_REQUEST)
    
    if request.user.role not in FULL_ACCESS_ROLES:
        logger.warning(f"Edit permission denied for users: {request.user.username}")
        return Response({'error': 'غير مسموح بالتعديل. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(pk=pk, club=request.user.club)
    except User.DoesNotExist:
        logger.error(f"User {pk} not found in club for user: {request.user.username}")
        return Response({'error': 'المستخدم غير موجود في ناديك.'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data.copy()
    data['club'] = request.user.club.id
    serializer = UserSerializer(user, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_users_api(request):
    """List active users."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'لا يوجد نادي مرتبط بك'}, status=status.HTTP_400_BAD_REQUEST)
    
    users = User.objects.filter(is_active=True, club=request.user.club)
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_users_with_paid_expenses(request):
    """Retrieve a list of users from the same club who have paid expenses (as paid_by)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'لا يوجد نادي مرتبط بك'}, status=status.HTTP_400_BAD_REQUEST)

    users = User.objects.filter(
        expenses_paid__isnull=False,
        expenses_paid__amount__gt=0,
        club=request.user.club
    ).distinct().prefetch_related('groups', 'user_permissions', 'groups__permissions', 'club')

    serializer = UserProfileSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_users_with_related_expenses(request):
    """Retrieve a list of users from the same club who are related to expenses (as related_employee)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'لا يوجد نادي مرتبط بك'}, status=status.HTTP_400_BAD_REQUEST)

    users = User.objects.filter(
        related_expenses__isnull=False,
        related_expenses__amount__gt=0,
        club=request.user.club
    ).distinct().prefetch_related('groups', 'user_permissions', 'groups__permissions', 'club')

    serializer = UserProfileSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_users_with_expenses(request):
    """Retrieve a list of users from the same club who have expenses (either as paid_by or related_employee)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'لا يوجد نادي مرتبط بك'}, status=status.HTTP_400_BAD_REQUEST)

    users = User.objects.filter(
        Q(expenses_paid__isnull=False, expenses_paid__amount__gt=0) | Q(related_expenses__isnull=False, related_expenses__amount__gt=0),
        club=request.user.club
    ).distinct().prefetch_related('groups', 'user_permissions', 'groups__permissions', 'club')

    serializer = UserProfileSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_system_users(request):
    """List users who actively perform operations in the system."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'لا يوجد نادي مرتبط بك'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Filter users who are in FULL_ACCESS_ROLES or have role 'reception'
    system_users = User.objects.filter(
        club=request.user.club,
        is_active=True
    ).filter(
        Q(role__in=FULL_ACCESS_ROLES) | Q(role='reception')
    ).distinct().prefetch_related('groups', 'user_permissions', 'groups__permissions')
    
    serializer = UserProfileSerializer(system_users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


PAYMENT_METHOD_TRANSLATIONS = {
    "Cash": "كاش",
    "Visa": "فيزا"
}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_shift_reports(request):
    """List simplified shift reports for users who perform operations in the system."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club", extra={'force': True})
        return Response({'error': 'لا يوجد نادي مرتبط بك'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get date range from query parameters
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    try:
        if start_date and end_date:
            # إزالة الإزاحة الزمنية إذا وجدت
            start_date = start_date.split('+')[0].split('%2B')[0]
            end_date = end_date.split('+')[0].split('%2B')[0]
            logger.debug(f"Removed timezone offset: start_date={start_date}, end_date={end_date}")
            
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%dT%H:%M:%S')
                end_date = datetime.strptime(end_date, '%Y-%m-%dT%H:%M:%S')
                logger.debug(f"Parsed ISO datetime: start_date={start_date}, end_date={end_date}")
            except ValueError:
                try:
                    start_date = datetime.strptime(start_date, '%Y-%m-%d').replace(hour=0, minute=0, second=0)
                    end_date = datetime.strptime(end_date, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
                    logger.debug(f"Fallback to date-only: start_date={start_date}, end_date={end_date}")
                except ValueError:
                    return Response({'error': 'صيغة التاريخ غير صحيحة (متوقع: YYYY-MM-DD أو YYYY-MM-DDTHH:MM:SS)'}, status=status.HTTP_400_BAD_REQUEST)
            start_date = timezone.make_aware(start_date)
            end_date = timezone.make_aware(end_date)
        else:
            # Default to last 7 days if no dates provided
            end_date = timezone.now()
            start_date = end_date - timezone.timedelta(days=7)
    except ValueError as e:
        logger.error(f"Error parsing date in api_shift_reports: {str(e)}", extra={'force': True})
        return Response({'error': 'صيغة التاريخ غير صحيحة (متوقع: YYYY-MM-DD أو YYYY-MM-DDTHH:MM:SS)'}, status=status.HTTP_400_BAD_REQUEST)

    # Filter users who perform operations (owner, admin, reception)
    system_users = User.objects.filter(
        club=request.user.club,
        is_active=True,
        role__in=FULL_ACCESS_ROLES + ['reception']
    ).distinct()

    report_data = []
    for user in system_users:
        # Get shifts within the date range
        shifts = StaffAttendance.objects.filter(
            staff=user,
            check_in__range=[start_date, end_date]
        ).select_related('staff').order_by('check_in')
        
        user_shifts = []
        for shift in shifts:
            # Get total expenses and incomes during the shift
            expenses = Expense.objects.filter(
                paid_by=user,
                date__range=[shift.check_in, shift.check_out or timezone.now()]
            ).aggregate(total_expense=Sum('amount'))['total_expense'] or Decimal('0.0')
            
            incomes = Income.objects.filter(
                received_by=user,
                date__range=[shift.check_in, shift.check_out or timezone.now()]
            )
            
            # التحقق من وجود إيرادات بدون طريقة دفع
            null_payment_methods = incomes.filter(payment_method__isnull=True).count()
            if null_payment_methods > 0:
                logger.warning(f"Found {null_payment_methods} income records with no payment method for user {user.username} in shift {shift.id}", extra={'force': True})

            # تجميع الإيرادات حسب طريقة الدفع
            income_by_payment_method = incomes.values('payment_method__name').annotate(
                total_income=Sum('amount')
            ).order_by('payment_method__name')

            total_income = incomes.aggregate(total_income=Sum('amount'))['total_income'] or Decimal('0.0')
            
            # إعداد بيانات طرق الدفع
            payment_methods_data = []
            for item in income_by_payment_method:
                method_name = item['payment_method__name'] or 'غير محدد'
                method_income = item['total_income'] or Decimal('0.0')
                method_expense = (method_income / total_income * expenses) if total_income > 0 else Decimal('0.0')
                method_net_profit = method_income - method_expense
                payment_methods_data.append({
                    'payment_method': PAYMENT_METHOD_TRANSLATIONS.get(method_name, method_name),
                    'total_income': float(method_income),
                    'total_expense': float(method_expense),
                    'net_profit': float(method_net_profit)
                })

            # Calculate shift duration in hours
            end_time = shift.check_out or timezone.now()
            duration = (end_time - shift.check_in).total_seconds() / 3600  # Convert to hours
            
            user_shifts.append({
                'shift_id': shift.id,
                'check_in': shift.check_in.isoformat(),
                'check_out': shift.check_out.isoformat() if shift.check_out else None,
                'total_income': float(total_income),
                'total_expense': float(expenses),
                'net_profit': float(total_income - expenses),
                'shift_duration': round(duration, 2),
                'payment_methods': payment_methods_data
            })
        
        report_data.append({
            'user_id': user.id,
            'username': user.username,
            'role': user.role,
            'shifts': user_shifts
        })

    return Response(report_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def staff_check_out_by_code(request):
    """Handle staff check-out using RFID code."""
    rfid_code = request.data.get('rfid_code')
    if not rfid_code:
        logger.error("RFID code not provided for check-out")
        return Response({'error': 'معرف RFID مطلوب.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(rfid_code=rfid_code, club=request.user.club)
    except User.DoesNotExist:
        logger.error(f"No user found with RFID code: {rfid_code} for club: {request.user.club}")
        return Response({'error': 'المستخدم غير موجود أو غير مرتبط بهذا النادي.'}, status=status.HTTP_404_NOT_FOUND)
    
    attendance = StaffAttendance.objects.filter(
        staff=user, club=request.user.club, check_out__isnull=True
    ).order_by('-check_in').first()
    
    if not attendance:
        logger.error(f"No active attendance found for user: {user.username}")
        return Response({'error': 'لا يوجد سجل حضور نشط لهذا الموظف.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        attendance.check_out = timezone.now()
        attendance.save(update_fields=['check_out'])
        logger.info(f"Check-out successful for user: {user.username}, shift_id: {attendance.id}")
        return Response({
            'message': 'تم تسجيل الخروج بنجاح',
            'shift_id': attendance.id,
            'check_out': attendance.check_out.isoformat()
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error during check-out for user: {user.username}, error: {str(e)}", exc_info=True)
        return Response({'error': 'حدث خطأ أثناء تسجيل الخروج.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def coach_list(request):
    """List active coaches."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'لا يوجد نادي مرتبط بك'}, status=status.HTTP_400_BAD_REQUEST)
    
    coaches = User.objects.filter(
        role='coach', is_active=True, club=request.user.club
    ).values('id', 'username')
    return Response(coaches, status=status.HTTP_200_OK)