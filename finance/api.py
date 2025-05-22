import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Expense, Income, ExpenseCategory, IncomeSource
from .serializers import (
    ExpenseSerializer, IncomeSerializer,
    ExpenseCategorySerializer, IncomeSourceSerializer,ExpenseDetailSerializer ,IncomeDetailSerializer,IncomeSummarySerializer
)
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub  
from rest_framework.pagination import PageNumberPagination
from datetime import datetime, timedelta
from core.models import Club
from staff.serializers import StaffAttendance 
from django.db.models import Sum, Q
from accounts.models import User
from django.utils.dateparse import parse_date
# Configure logging
logger = logging.getLogger(__name__)

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 20

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def expense_category_api(request):
    if request.method == 'GET':
        # Initialize queryset based on user role
        if request.user.role == 'owner':
            categories = ExpenseCategory.objects.all()
        else:
            categories = ExpenseCategory.objects.filter(club=request.user.club)

        # Apply filters if provided
        name = request.query_params.get('name', '')
        description = request.query_params.get('description', '')
        if name:
            categories = categories.filter(name__icontains=name)
        if description:
            categories = categories.filter(description__icontains=description)

        # Order by ID (descending)
        categories = categories.order_by('-id')

        # Apply pagination
        paginator = StandardPagination()
        page = paginator.paginate_queryset(categories, request)
        serializer = ExpenseCategorySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ExpenseCategorySerializer(data=request.data)
        if serializer.is_valid():
            category = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Expense Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def expense_api(request):
    if request.method == 'GET':
        if request.user.role in ['owner', 'admin']:
            expenses = Expense.objects.select_related('category', 'paid_by').all().order_by('-id')
        else:
            today = datetime.now().date()
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_in__date=today
            ).order_by('-check_in').first()
            
            if attendance:
                expenses = Expense.objects.select_related('category', 'paid_by').filter(
                    club=request.user.club,
                    paid_by=request.user,  # الموظف بس اللي أدخل المصروف
                    date__gte=attendance.check_in,
                    date__lte=attendance.check_out if attendance.check_out else datetime.now()
                ).order_by('-date')
            else:
                expenses = Expense.objects.none()
        
        paginator = StandardPagination()
        page = paginator.paginate_queryset(expenses, request)
        serializer = ExpenseSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        data = request.data.copy()
        data['paid_by'] = request.user.id
        
        club_id = data.get('club')
        if club_id:
            club = get_object_or_404(Club, id=club_id)
        
        serializer = ExpenseSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            expense = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def income_source_api(request):
    if request.method == 'GET':
        if request.user.role == 'owner':
            sources = IncomeSource.objects.all().order_by('-id')
        else:
            sources = IncomeSource.objects.filter(club=request.user.club).order_by('-id')

        # Add filtering by name and description
        name = request.query_params.get('name', None)
        description = request.query_params.get('description', None)
        
        if name:
            sources = sources.filter(name__icontains=name)
        if description:
            sources = sources.filter(description__icontains=description)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(sources, request)
        serializer = IncomeSourceSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        serializer = IncomeSourceSerializer(data=request.data)
        if serializer.is_valid():
            source = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Income Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def income_api(request):
    if request.method == 'GET':
        if request.user.role in ['owner', 'admin']:
            incomes = Income.objects.select_related('source', 'received_by').all()
        else:
            # جيب آخر سجل حضور مفتوح أو مغلق اليوم
            today = datetime.now().date()
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_in__date=today
            ).order_by('-id').first()
            
            if attendance:
                incomes = Income.objects.select_related('source', 'received_by').filter(
                    club=request.user.club,
                    received_by=request.user, 
                    date__gte=attendance.check_in,
                    date__lte=attendance.check_out if attendance.check_out else datetime.now()
                )
            else:
                incomes = Income.objects.none()

        # Apply filters based on query parameters
        source = request.query_params.get('source')
        amount = request.query_params.get('amount')
        description = request.query_params.get('description')

        if source:
            # Validate source name exists
            if not IncomeSource.objects.filter(name__icontains=source).exists():
                return Response({"error": "No income source found with this name"}, status=status.HTTP_400_BAD_REQUEST)
            incomes = incomes.filter(source__name__icontains=source)  # Filter by IncomeSource name
        if amount:
            try:
                incomes = incomes.filter(amount=float(amount))
            except ValueError:
                return Response({"error": "Invalid amount format"}, status=status.HTTP_400_BAD_REQUEST)
        if description:
            incomes = incomes.filter(description__icontains=description)

        incomes = incomes.order_by('-id')
        
        paginator = StandardPagination()
        page = paginator.paginate_queryset(incomes, request)
        serializer = IncomeSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        data = request.data.copy()
        data['received_by'] = request.user.id
        
        club_id = data.get('club')
        if club_id:
            club = get_object_or_404(Club, id=club_id)
        
        serializer = IncomeSerializer(data=data)
        if serializer.is_valid():
            income = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Detail Views

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def expense_detail_api(request, pk):
    expense = get_object_or_404(Expense, pk=pk)
    
    if request.method == 'GET':
        serializer = ExpenseSerializer(expense, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ExpenseSerializer(expense, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated_expense = serializer.save()
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, updated_expense):
                return Response({'error': 'You do not have permission to update this expense to this club'}, status=status.HTTP_403_FORBIDDEN)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def income_detail_api(request, pk):
    income = get_object_or_404(Income, pk=pk)
    
    if request.method == 'GET':
        serializer = IncomeSerializer(income)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = IncomeSerializer(income, data=request.data, partial=True)
        if serializer.is_valid():
            updated_income = serializer.save()
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, updated_income):
                return Response({'error': 'You do not have permission to update this income to this club'}, status=status.HTTP_403_FORBIDDEN)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        income.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
import datetime as dt


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def daily_summary_api(request):
    if request.user.role not in ['owner', 'admin']:
        return Response({'error': 'Only owners and admins can view daily summaries'}, status=status.HTTP_403_FORBIDDEN)
    
    date_str = request.query_params.get('date')  
    month_str = request.query_params.get('month')  
    username = request.query_params.get('username')  
    
    if date_str:
        try:
            filter_date = dt.datetime.strptime(date_str, '%Y-%m-%d').date()
            date_filter = {'check_in__date': filter_date}
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
    elif month_str:
        try:
            year, month = map(int, month_str.split('-'))
            date_filter = {'check_in__year': year, 'check_in__month': month}
        except ValueError:
            return Response({'error': 'Invalid month format. Use YYYY-MM.'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        filter_date = datetime.now().date()
        date_filter = {'check_in__date': filter_date}
    
    if username:
        employees = User.objects.filter(club=request.user.club, username=username)
        if not employees.exists():
            return Response({'error': 'Employee with this username not found or not in this club.'}, status=status.HTTP_404_NOT_FOUND)
    else:
        employees = User.objects.filter(club=request.user.club)
    
    summary = []
    
    for employee in employees:
        attendances = StaffAttendance.objects.filter(
            staff=employee,
            club=request.user.club,
            **date_filter
        )
        
        employee_summary = {
            'employee_id': employee.id,
            'employee_name': employee.username,
            'attendance_periods': [],
            'total_expenses': 0,
            'total_incomes': 0,
            'net': 0
        }
        
        for attendance in attendances:
            expenses = Expense.objects.filter(
                club=request.user.club,
                paid_by=employee,
                date__gte=attendance.check_in,
                date__lte=attendance.check_out if attendance.check_out else datetime.now()
            )
            
            incomes = Income.objects.filter(
                club=request.user.club,
                received_by=employee,
                date__gte=attendance.check_in,
                date__lte=attendance.check_out if attendance.check_out else datetime.now()
            )
            
            total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0
            total_incomes = incomes.aggregate(total=Sum('amount'))['total'] or 0
            
            expense_details = ExpenseDetailSerializer(expenses, many=True).data
            income_details = IncomeDetailSerializer(incomes, many=True).data
            
            attendance_summary = {
                'attendance_id': attendance.id,
                'check_in': attendance.check_in,
                'check_out': attendance.check_out,
                'duration_hours': attendance.duration_hours(),
                'expenses': expense_details,
                'incomes': income_details,
                'total_expenses': total_expenses,
                'total_incomes': total_incomes,
                'net': total_incomes - total_expenses
            }
            
            employee_summary['attendance_periods'].append(attendance_summary)
            employee_summary['total_expenses'] += total_expenses
            employee_summary['total_incomes'] += total_incomes
        
        employee_summary['net'] = employee_summary['total_incomes'] - employee_summary['total_expenses']
        if employee_summary['attendance_periods']:  
            summary.append(employee_summary)


    paginator = StandardPagination()
    page = paginator.paginate_queryset(summary, request)
    return paginator.get_paginated_response(page)


def get_object_from_id_or_name(model, value, fields=['id', 'name']):
    """
    Retrieve an object by ID or name. Returns None if not found or multiple results exist.
    """
    try:
        return model.objects.get(id=int(value))
    except (ValueError, model.DoesNotExist):
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__iexact": value})
        results = model.objects.filter(q)
        return results.first() if results.count() == 1 else None

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def income_summary(request):
    """
    Calculate total income based on filters.
    Query params:
    - date: Specific date (YYYY-MM-DD)
    - start: Start date (YYYY-MM-DD)
    - end: End date (YYYY-MM-DD)
    - user: User ID or username
    - source: Income source ID or name
    - details: Boolean to include detailed records (true/false)
    """
    try:
        # Initialize queryset based on user role
        if request.user.role in ['owner', 'admin']:
            incomes = Income.objects.select_related('source', 'received_by').filter(club=request.user.club)
        else:
            today = datetime.now().date()
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_in__date=today
            ).order_by('-check_in').first()
            if attendance:
                incomes = Income.objects.select_related('source', 'received_by').filter(
                    club=request.user.club,
                    received_by=request.user,
                    date__gte=attendance.check_in,
                    date__lte=attendance.check_out if attendance.check_out else datetime.now()
                )
            else:
                incomes = Income.objects.none()

        # Apply filters
        date = request.query_params.get('date')
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        user_param = request.query_params.get('user')
        source_param = request.query_params.get('source')
        details = request.query_params.get('details', 'false').lower() == 'true'

        if date:
            try:
                date_obj = datetime.strptime(date, '%Y-%m-%d').date()
                incomes = incomes.filter(date=date_obj)
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

        if start and end:
            try:
                start_obj = datetime.strptime(start, '%Y-%m-%d').date()
                end_obj = datetime.strptime(end, '%Y-%m-%d').date()
                incomes = incomes.filter(date__range=[start_obj, end_obj])
            except ValueError:
                return Response({'error': 'Invalid date format for start or end. Use YYYY-MM-DD.'}, status=400)
        elif start or end:
            return Response({'error': 'Both start and end dates are required.'}, status=400)

        if user_param:
            user_obj = get_object_from_id_or_name(User, user_param, ['id', 'username'])
            if user_obj:
                incomes = incomes.filter(received_by=user_obj)
            else:
                return Response({'error': 'User not found or multiple matches.'}, status=400)

        if source_param:
            source_obj = get_object_from_id_or_name(IncomeSource, source_param, ['id', 'name'])
            if source_obj:
                incomes = incomes.filter(source=source_obj)
            else:
                return Response({'error': 'Income source not found or multiple matches.'}, status=400)

        # Calculate total
        total = incomes.aggregate(total_amount=Sum('amount'))['total_amount'] or 0
        response_data = {'total_income': float(total)}

        # Include details if requested
        if details:
            response_data['details'] = IncomeSummarySerializer(incomes, many=True).data

        return Response(response_data, status=200)

    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def expense_summary(request):
    """
    Calculate total expenses based on filters.
    Query params:
    - date: Specific date (YYYY-MM-DD)
    - start: Start date (YYYY-MM-DD)
    - end: End date (YYYY-MM-DD)
    - user: User ID or username
    - category: Expense category ID or name
    - details: Boolean to include detailed records (true/false)
    """
    try:
        # Initialize queryset based on user role
        if request.user.role in ['owner', 'admin']:
            expenses = Expense.objects.select_related('category', 'paid_by').filter(club=request.user.club)
        else:
            today = datetime.now().date()
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_in__date=today
            ).order_by('-check_in').first()
            if attendance:
                expenses = Expense.objects.select_related('category', 'paid_by').filter(
                    club=request.user.club,
                    paid_by=request.user,
                    date__gte=attendance.check_in,
                    date__lte=attendance.check_out if attendance.check_out else datetime.now()
                )
            else:
                expenses = Expense.objects.none()

        # Apply filters
        date = request.query_params.get('date')
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        user_param = request.query_params.get('user')
        category_param = request.query_params.get('category')
        details = request.query_params.get('details', 'false').lower() == 'true'

        if date:
            try:
                date_obj = datetime.strptime(date, '%Y-%m-%d').date()
                expenses = expenses.filter(date=date_obj)
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

        if start and end:
            try:
                start_obj = datetime.strptime(start, '%Y-%m-%d').date()
                end_obj = datetime.strptime(end, '%Y-%m-%d').date()
                expenses = expenses.filter(date__range=[start_obj, end_obj])
            except ValueError:
                return Response({'error': 'Invalid date format for start or end. Use YYYY-MM-DD.'}, status=400)
        elif start or end:
            return Response({'error': 'Both start and end dates are required.'}, status=400)

        if user_param:
            user_obj = get_object_from_id_or_name(User, user_param, ['id', 'username'])
            if user_obj:
                expenses = expenses.filter(paid_by=user_obj)
            else:
                return Response({'error': 'User not found or multiple matches.'}, status=400)

        if category_param:
            category_obj = get_object_from_id_or_name(ExpenseCategory, category_param, ['id', 'name'])
            if category_obj:
                expenses = expenses.filter(category=category_obj)
            else:
                return Response({'error': 'Expense category not found or multiple matches.'}, status=400)

        # Calculate total
        total = expenses.aggregate(total_amount=Sum('amount'))['total_amount'] or 0
        response_data = {'total_expense': float(total)}

        # Include details if requested
        if details:
            response_data['details'] = ExpenseDetailSerializer(expenses, many=True).data

        return Response(response_data, status=200)

    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def finance_overview(request):
    """
    Provide an overview of total income, expenses, and net profit.
    Query params:
    - start: Start date (YYYY-MM-DD)
    - end: End date (YYYY-MM-DD)
    """
    try:
        # Initialize querysets
        income_qs = Income.objects.select_related('source', 'received_by').filter(club=request.user.club)
        expense_qs = Expense.objects.select_related('category', 'paid_by').filter(club=request.user.club)

        # Apply date range filter
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if start and end:
            try:
                start_obj = datetime.strptime(start, '%Y-%m-%d').date()
                end_obj = datetime.strptime(end, '%Y-%m-%d').date()
                income_qs = income_qs.filter(date__range=[start_obj, end_obj])
                expense_qs = expense_qs.filter(date__range=[start_obj, end_obj])
            except ValueError:
                return Response({'error': 'Invalid date format for start or end. Use YYYY-MM-DD.'}, status=400)
        elif start or end:
            return Response({'error': 'Both start and end dates are required.'}, status=400)

        # Calculate totals
        total_income = income_qs.aggregate(total=Sum('amount'))['total'] or 0
        total_expense = expense_qs.aggregate(total=Sum('amount'))['total'] or 0
        net = total_income - total_expense

        return Response({
            'total_income': float(total_income),
            'total_expense': float(total_expense),
            'net_profit': float(net)
        }, status=200)

    except Exception as e:
        return Response({'error': str(e)}, status=500)