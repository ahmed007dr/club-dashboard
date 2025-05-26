from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from .models import PayrollPeriod, Payroll, PayrollDeduction
from .serializers import (
    PayrollPeriodSerializer, PayrollSerializer,
    PayrollCreateSerializer, PayrollDeductionCreateSerializer
)
from django.utils import timezone
from utils.permissions import IsOwnerOrRelatedToClub
from django.db.models import Q

class CustomPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def get_payroll_periods(request):
    periods = PayrollPeriod.objects.all()
    if request.user.role != 'owner':
        if not request.user.club:
            return Response({'detail': 'User is not associated with any club'}, status=status.HTTP_403_FORBIDDEN)
        periods = periods.filter(club=request.user.club)

    search_query = request.query_params.get('search', None)
    if search_query:
        periods = periods.filter(
            Q(club__name__icontains=search_query) |
            Q(start_date__icontains=search_query) |
            Q(end_date__icontains=search_query)
        )

    is_active = request.query_params.get('is_active', None)
    if is_active is not None:
        periods = periods.filter(is_active=is_active.lower() == 'true')

    club_id = request.query_params.get('club_id', None)
    if club_id and request.user.role == 'owner':
        periods = periods.filter(club_id=club_id)

    paginator = CustomPageNumberPagination()
    paginated_periods = paginator.paginate_queryset(periods, request)
    serializer = PayrollPeriodSerializer(paginated_periods, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def create_payroll_period(request):
    serializer = PayrollPeriodSerializer(data=request.data)
    if serializer.is_valid():
        club_id = serializer.validated_data['club'].id
        if request.user.role != 'owner' and (not request.user.club or request.user.club.id != club_id):
            return Response({'detail': 'You can only create periods for your club'}, status=status.HTTP_403_FORBIDDEN)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def get_current_period(request):
    periods = PayrollPeriod.objects.filter(is_active=True)
    if request.user.role != 'owner':
        if not request.user.club:
            return Response({'detail': 'User is not associated with any club'}, status=status.HTTP_403_FORBIDDEN)
        periods = periods.filter(club=request.user.club)
    
    period = periods.first()
    if not period:
        return Response({'detail': 'No active payroll period found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = PayrollPeriodSerializer(period)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def get_payroll_report(request):
    period_id = request.query_params.get('period_id', None)
    if period_id:
        try:
            period = PayrollPeriod.objects.get(id=period_id)
            if request.user.role != 'owner' and (not request.user.club or request.user.club != period.club):
                return Response({'detail': 'You do not have permission to access this period'}, status=status.HTTP_403_FORBIDDEN)
        except PayrollPeriod.DoesNotExist:
            return Response({'detail': 'Period not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        periods = PayrollPeriod.objects.filter(is_active=True)
        if request.user.role != 'owner':
            if not request.user.club:
                return Response({'detail': 'User is not associated with any club'}, status=status.HTTP_403_FORBIDDEN)
            periods = periods.filter(club=request.user.club)
        period = periods.first()
        if not period:
            return Response({'detail': 'No active payroll period found'}, status=status.HTTP_404_NOT_FOUND)

    payrolls = Payroll.objects.filter(period=period)

    search_query = request.query_params.get('search', None)
    if search_query:
        payrolls = payrolls.filter(employee__username__icontains=search_query)

    club_id = request.query_params.get('club_id', None)
    if club_id and request.user.role == 'owner':
        payrolls = payrolls.filter(club_id=club_id)

    is_employee = request.query_params.get('is_employee', None)
    if is_employee is not None:
        is_employee_bool = is_employee.lower() == 'true'
        if is_employee_bool:
            payrolls = payrolls.filter(
                employee__payroll_contracts__start_date__lte=period.start_date,
                employee__payroll_contracts__club=period.club
            )
        else:
            payrolls = payrolls.exclude(
                employee__payroll_contracts__start_date__lte=period.start_date,
                employee__payroll_contracts__club=period.club
            )

    paginator = CustomPageNumberPagination()
    paginated_payrolls = paginator.paginate_queryset(payrolls.prefetch_related('deductions'), request)
    serializer = PayrollSerializer(paginated_payrolls, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def create_payroll(request):
    serializer = PayrollCreateSerializer(data=request.data)
    if serializer.is_valid():
        club_id = serializer.validated_data['club'].id
        period = serializer.validated_data['period']
        if request.user.role != 'owner':
            if not request.user.club or request.user.club.id != club_id:
                return Response({'detail': 'You can only create payrolls for your club'}, status=status.HTTP_403_FORBIDDEN)
            if period.club != request.user.club:
                return Response({'detail': 'Period does not belong to your club'}, status=status.HTTP_403_FORBIDDEN)
        serializer.save()
        payroll = Payroll.objects.get(id=serializer.instance.id)
        return Response(PayrollSerializer(payroll).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def create_deduction(request):
    serializer = PayrollDeductionCreateSerializer(data=request.data)
    if serializer.is_valid():
        payroll = serializer.validated_data['payroll']
        if request.user.role != 'owner' and (not request.user.club or request.user.club != payroll.club):
            return Response({'detail': 'You do not have permission to add deductions to this payroll'}, status=status.HTTP_403_FORBIDDEN)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def finalize_payroll(request):
    """
    Finalize payrolls for a given period, marking them as finalized and recording salaries as expenses.
    Query params:
    - period_id: ID of the payroll period to finalize
    """
    period_id = request.query_params.get('period_id')
    if not period_id:
        return Response({'error': 'period_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        period = PayrollPeriod.objects.get(id=period_id)
        if request.user.role != 'owner' and (not request.user.club or request.user.club != period.club):
            return Response({'detail': 'You do not have permission to finalize payrolls for this period'}, status=status.HTTP_403_FORBIDDEN)
    except PayrollPeriod.DoesNotExist:
        return Response({'error': 'Payroll period not found'}, status=status.HTTP_404_NOT_FOUND)

    payrolls = Payroll.objects.filter(period=period, is_finalized=False)
    if not payrolls.exists():
        return Response({'detail': 'No pending payrolls to finalize for this period'}, status=status.HTTP_400_BAD_REQUEST)

    for payroll in payrolls:
        payroll.finalize()

    return Response({'detail': f'Successfully finalized {payrolls.count()} payrolls'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payroll_details(request, payroll_id):
    try:
        payroll = Payroll.objects.get(id=payroll_id)
        serializer = PayrollSerializer(payroll)
        return Response(serializer.data)
    except Payroll.DoesNotExist:
        return Response({"detail": "Payroll not found"}, status=404)