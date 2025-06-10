import os
import subprocess
import logging
import tempfile
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from django.db.models import Sum, Q, F
from django.db.models.expressions import RawSQL  
from django.db import models
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from jinja2 import Template
from decimal import Decimal


from accounts.models import User
from staff.models import StaffAttendance
from .models import Expense, Income, ExpenseCategory, IncomeSource
from .serializers import (
    ExpenseSerializer, IncomeSerializer,
    ExpenseCategorySerializer, IncomeSourceSerializer,
    ExpenseDetailSerializer, IncomeDetailSerializer,
    IncomeSummarySerializer
)

from utils.permissions import IsOwnerOrRelatedToClub
from utils.reports import get_employee_report_data
from utils.convert_to_name import get_object_from_id_or_name

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
        categories = ExpenseCategory.objects.filter(club=request.user.club)

        name = request.query_params.get('name', '')
        description = request.query_params.get('description', '')
        if name:
            categories = categories.filter(name__icontains=name)
        if description:
            categories = categories.filter(description__icontains=description)

        categories = categories.order_by('-id')
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

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def expense_api(request):
    if request.method == 'GET':
        if request.user.role in ['owner', 'admin']:
            expenses = Expense.objects.select_related('category', 'paid_by').filter(
                club=request.user.club
            ).order_by('-id')
        else:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True  
            ).order_by('-check_in').first()
            
            if attendance:
                expenses = Expense.objects.select_related('category', 'paid_by').filter(
                    club=request.user.club,
                    paid_by=request.user,
                    date__gte=attendance.check_in,
                    date__lte=timezone.now()
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
        if club_id and int(club_id) != request.user.club.id:
            return Response({'error': 'You can only create expenses for your own club'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ExpenseSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            expense = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def income_source_api(request):
    if request.method == 'GET':
        sources = IncomeSource.objects.filter(club=request.user.club)

        # sources = sources.filter(price__gt=0)

        name = request.query_params.get('name', None)
        description = request.query_params.get('description', None)
        
        if name:
            sources = sources.filter(name__icontains=name)
        if description:
            sources = sources.filter(description__icontains=description)

        sources = sources.order_by('-id')
        paginator = StandardPagination()
        page = paginator.paginate_queryset(sources, request)
        serializer = IncomeSourceSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        if request.user.role != 'admin':
            return Response({'error': 'Only admin can create income sources'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['club'] = request.user.club.id
        
        serializer = IncomeSourceSerializer(data=data)
        if serializer.is_valid():
            source = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def income_api(request):
    if request.method == 'GET':
        if request.user.role in ['owner', 'admin']:
            incomes = Income.objects.select_related('source', 'received_by').filter(
                club=request.user.club
            )
        else:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True
            ).order_by('-check_in').first()
            
            if attendance:
                incomes = Income.objects.select_related('source', 'received_by').filter(
                    club=request.user.club,
                    received_by=request.user,
                    date__gte=attendance.check_in,
                    date__lte=timezone.now()
                )
            else:
                incomes = Income.objects.none()

        source = request.query_params.get('source')
        amount = request.query_params.get('amount')
        description = request.query_params.get('description')

        if source:
            try:
                source_id = int(source)
                if not IncomeSource.objects.filter(id=source_id, club=request.user.club).exists():
                    return Response({"error": "No income source found with this ID in your club"}, status=status.HTTP_400_BAD_REQUEST)
                incomes = incomes.filter(source_id=source_id)
            except ValueError:
                return Response({"error": "Invalid source ID format"}, status=status.HTTP_400_BAD_REQUEST)
        
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
        data['club'] = request.user.club.id
        data['date'] = timezone.now().date().isoformat()  # إضافة التاريخ تلقائيًا

        source_id = data.get('source')
        if not source_id:
            return Response({'error': 'Source is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            source = IncomeSource.objects.get(id=source_id, club=request.user.club)
            data['amount'] = float(source.price)
        except IncomeSource.DoesNotExist:
            return Response({'error': 'Invalid source ID'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Invalid price in source'}, status=status.HTTP_400_BAD_REQUEST)

        if 'description' not in data or not data['description']:
            data['description'] = ''

        serializer = IncomeSerializer(data=data)
        if serializer.is_valid():
            income = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)    
    
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def expense_detail_api(request, pk):
    expense = get_object_or_404(Expense, pk=pk)
    
    if request.method == 'GET':
        if expense.club != request.user.club:
            return Response({'error': 'You can only view expenses for your own club'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role not in ['owner', 'admin'] and expense.paid_by != request.user:
            return Response({'error': 'You can only view your own expenses'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ExpenseSerializer(expense, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        if request.user.role != 'owner':
            return Response({'error': 'Only owners can update expenses'}, status=status.HTTP_403_FORBIDDEN)
        if expense.club != request.user.club:
            return Response({'error': 'You can only update expenses for your own club'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = ExpenseSerializer(expense, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated_expense = serializer.save()
            if updated_expense.club != request.user.club:
                return Response({'error': 'You do not have permission to update this expense to this club'}, status=status.HTTP_403_FORBIDDEN)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if request.user.role != 'owner':
            return Response({'error': 'Only owners can delete expenses'}, status=status.HTTP_403_FORBIDDEN)
        if expense.club != request.user.club:
            return Response({'error': 'You can only delete expenses for your own club'}, status=status.HTTP_403_FORBIDDEN)
        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
        
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def income_detail_api(request, pk):
    income = get_object_or_404(Income, pk=pk)
    
    if request.method == 'GET':
        if income.club != request.user.club:
            return Response({'error': 'You can only view incomes for your own club'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role not in ['owner', 'admin'] and income.received_by != request.user:
            return Response({'error': 'You can only view your own incomes'}, status=status.HTTP_403_FORBIDDEN)
        serializer = IncomeSerializer(income)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        if request.user.role != 'owner':
            return Response({'error': 'Only owners can update incomes'}, status=status.HTTP_403_FORBIDDEN)
        if income.club != request.user.club:
            return Response({'error': 'You can only update incomes for your own club'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = IncomeSerializer(income, data=request.data, partial=True)
        if serializer.is_valid():
            updated_income = serializer.save()
            if updated_income.club != request.user.club:
                return Response({'error': 'You do not have permission to update this income to this club'}, status=status.HTTP_403_FORBIDDEN)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if request.user.role != 'owner':
            return Response({'error': 'Only owners can delete incomes'}, status=status.HTTP_403_FORBIDDEN)
        if income.club != request.user.club:
            return Response({'error': 'You can only delete incomes for your own club'}, status=status.HTTP_403_FORBIDDEN)
        income.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
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
            filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
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
        filter_date = timezone.now().date()
        date_filter = {'check_in__date': filter_date}
    
    club_filter = {'club': request.user.club}
    
    if username:
        employees = User.objects.filter(**club_filter, username=username)
        if not employees.exists():
            return Response({'error': 'Employee with this username not found or not in this club.'}, status=status.HTTP_404_NOT_FOUND)
    else:
        employees = User.objects.filter(**club_filter)
    
    summary = []
    
    for employee in employees:
        attendances = StaffAttendance.objects.filter(
            staff=employee,
            **club_filter,
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
                **club_filter,
                paid_by=employee,
                date__gte=attendance.check_in,
                date__lte=attendance.check_out if attendance.check_out else timezone.now()
            )
            
            incomes = Income.objects.filter(
                **club_filter,
                received_by=employee,
                date__gte=attendance.check_in,
                date__lte=attendance.check_out if attendance.check_out else timezone.now()
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

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def income_summary(request):
    try:
        if request.user.role in ['owner', 'admin']:
            incomes = Income.objects.select_related('source', 'received_by').filter(
                club=request.user.club
            )
        else:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True  
            ).order_by('-check_in').first()
            
            if not attendance:
                return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

            incomes = Income.objects.select_related('source', 'received_by').filter(
                club=request.user.club,
                received_by=request.user,
                date__gte=attendance.check_in,
                date__lte=timezone.now()
            )

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
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        if start and end:
            try:
                start_date = datetime.strptime(start, '%Y-%m-%d').date()
                end_date = datetime.strptime(end, '%Y-%m-%d').date()
                # For Reception and Accountant, ensure date range is within their shift
                if request.user.role not in ['owner', 'admin']:
                    if start_date < attendance.check_in.date() or end_date > timezone.now().date():
                        return Response({'error': 'Date range must be within your shift.'}, status=status.HTTP_400_BAD_REQUEST)
                incomes = incomes.filter(date__range=[start_date, end_date])
            except ValueError:
                return Response({'error': 'Invalid date format for start or end. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        elif start or end:
            return Response({'error': 'Both start and end dates are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if user_param:
            user_obj = get_object_from_id_or_name(User, user_param, ['id', 'username'])
            if user_obj and user_obj.club == request.user.club:
                if request.user.role not in ['owner', 'admin'] and user_obj.id != request.user.id:
                    return Response({'error': 'You can only view your own income.'}, status=status.HTTP_403_FORBIDDEN)
                incomes = incomes.filter(received_by=user_obj)
            else:
                return Response({'error': 'User not found or not in your club.'}, status=status.HTTP_400_BAD_REQUEST)

        if source_param:
            source_obj = get_object_from_id_or_name(IncomeSource, source_param, ['id', 'name'])
            if source_obj and source_obj.club == request.user.club:
                incomes = incomes.filter(source=source_obj)
            else:
                return Response({'error': 'Income source not found or not in your club.'}, status=status.HTTP_400_BAD_REQUEST)

        total = incomes.aggregate(total_amount=Sum('amount'))['total_amount'] or 0
        response_data = {'total_income': float(total)}

        if details:
            response_data['details'] = IncomeSummarySerializer(incomes, many=True).data

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def expense_summary(request):
    try:
        if request.user.role in ['owner', 'admin']:
            expenses = Expense.objects.select_related('category', 'paid_by').filter(
                club=request.user.club
            )
        else:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True  # التأكد إن الشيفت مفتوح
            ).order_by('-check_in').first()
            
            if not attendance:
                return Response({'error': 'No open shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

            expenses = Expense.objects.select_related('category', 'paid_by').filter(
                club=request.user.club,
                paid_by=request.user,
                date__gte=attendance.check_in,
                date__lte=timezone.now()
            )

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
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        if start and end:
            try:
                start_obj = datetime.strptime(start, '%Y-%m-%d').date()
                end_obj = datetime.strptime(end, '%Y-%m-%d').date()
                if request.user.role not in ['owner', 'admin']:
                    if start_obj < attendance.check_in.date() or end_obj > timezone.now().date():
                        return Response({'error': 'Date range must be within your shift.'}, status=status.HTTP_400_BAD_REQUEST)
                expenses = expenses.filter(date__range=[start_obj, end_obj])
            except ValueError:
                return Response({'error': 'Invalid date format for start or end. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        elif start or end:
            return Response({'error': 'Both start and end dates are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if user_param:
            user_obj = get_object_from_id_or_name(User, user_param, ['id', 'username'])
            if user_obj and user_obj.club == request.user.club:
                if request.user.role not in ['owner', 'admin'] and user_obj.id != request.user.id:
                    return Response({'error': 'You can only view your own expenses.'}, status=status.HTTP_403_FORBIDDEN)
                expenses = expenses.filter(paid_by=user_obj)
            else:
                return Response({'error': 'User not found or not in your club.'}, status=status.HTTP_400_BAD_REQUEST)

        if category_param:
            category_obj = get_object_from_id_or_name(ExpenseCategory, category_param, ['id', 'name'])
            if category_obj and category_obj.club == request.user.club:
                expenses = expenses.filter(category=category_obj)
            else:
                return Response({'error': 'Expense category not found or not in your club.'}, status=status.HTTP_400_BAD_REQUEST)

        total = expenses.aggregate(total_amount=Sum('amount'))['total_amount'] or 0
        response_data = {'total_expense': float(total)}

        if details:
            response_data['details'] = ExpenseDetailSerializer(expenses, many=True).data

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def finance_overview(request):
    try:
        if request.user.role not in ['owner', 'admin']:
            return Response({'error': 'Only owners and admins can view finance overview'}, status=status.HTTP_403_FORBIDDEN)

        income_qs = Income.objects.select_related('source', 'received_by').filter(club=request.user.club)
        expense_qs = Expense.objects.select_related('category', 'paid_by').filter(club=request.user.club)

        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if start and end:
            try:
                start_obj = datetime.strptime(start, '%Y-%m-%d').date()
                end_obj = datetime.strptime(end, '%Y-%m-%d').date()
                income_qs = income_qs.filter(date__range=[start_obj, end_obj])
                expense_qs = expense_qs.filter(date__range=[start_obj, end_obj])
            except ValueError:
                return Response({'error': 'Invalid date format for start or end. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        elif start or end:
            return Response({'error': 'Both start and end dates are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # حساب الإجماليات
        total_income = income_qs.aggregate(total=Sum('amount'))['total'] or 0
        total_expense = expense_qs.aggregate(total=Sum('amount'))['total'] or 0
        net = total_income - total_expense

        return Response({
            'total_income': float(total_income),
            'total_expense': float(total_expense),
            'net_profit': float(net)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def employee_daily_report_api(request):
    employee_id = request.query_params.get('employee_id')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    if not start_date or not end_date:
        if request.user.role in ['owner', 'admin']:
            return Response({'error': 'يجب تحديد تاريخ البداية والنهاية'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True
            ).order_by('-check_in').first()
            if not attendance:
                return Response({'error': 'لا توجد وردية مفتوحة. يجب تسجيل حضور أولاً.'}, status=status.HTTP_404_NOT_FOUND)

            start_date = attendance.check_in.isoformat()
            end_date = timezone.now().isoformat()
            employee_id = request.user.id 

    if request.user.role not in ['owner', 'admin']:
        if employee_id and str(employee_id) != str(request.user.id):
            return Response({'error': 'غير مسموح لك بمشاهدة تقارير موظف آخر'}, status=status.HTTP_403_FORBIDDEN)
        employee_id = request.user.id 

    if employee_id:
        employee = get_object_or_404(User, id=employee_id)
        if employee.club != request.user.club:
            return Response({'error': 'الموظف ليس في ناديك'}, status=status.HTTP_403_FORBIDDEN)

    data, status_code = get_employee_report_data(
        user=request.user,
        employee_id=employee_id if employee_id else None,  
        start_date=start_date,
        end_date=end_date
    )
    return Response(data, status=status_code)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def expense_all_api(request):
    try:
        if request.user.role in ['owner', 'admin']:
            expenses = Expense.objects.select_related('category', 'paid_by').filter(
                club=request.user.club
            ).order_by('-id')
        else:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True
            ).order_by('-check_in').first()
            
            if attendance:
                expenses = Expense.objects.select_related('category', 'paid_by').filter(
                    club=request.user.club,
                    paid_by=request.user,
                    date__gte=attendance.check_in,
                    date__lte=timezone.now()
                ).order_by('-date')
            else:
                expenses = Expense.objects.none()

        # تطبيق الفلاتر
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        category = request.query_params.get('category')

        if start and end:
            try:
                start_obj = datetime.strptime(start, '%Y-%m-%d').date()
                end_obj = datetime.strptime(end, '%Y-%m-%d').date()
                if request.user.role not in ['owner', 'admin']:
                    if start_obj < attendance.check_in.date() or end_obj > timezone.now().date():
                        return Response(
                            {'error': 'Date range must be within your shift.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                expenses = expenses.filter(date__range=[start_obj, end_obj])
            except ValueError:
                return Response(
                    {'error': 'Invalid date format for start or end. Use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif start or end:
            return Response(
                {'error': 'Both start and end dates are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if category:
            category_obj = get_object_from_id_or_name(ExpenseCategory, category, ['id', 'name'])
            if category_obj and category_obj.club == request.user.club:
                expenses = expenses.filter(category=category_obj)
            else:
                return Response(
                    {'error': 'Expense category not found or not in your club.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = ExpenseSerializer(expenses, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def income_all_api(request):
    try:
        if request.user.role in ['owner', 'admin']:
            incomes = Income.objects.select_related('source', 'received_by').filter(
                club=request.user.club
            )
        else:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club,
                check_out__isnull=True
            ).order_by('-check_in').first()
            
            if attendance:
                incomes = Income.objects.select_related('source', 'received_by').filter(
                    club=request.user.club,
                    received_by=request.user,
                    date__gte=attendance.check_in,
                    date__lte=timezone.now()
                )
            else:
                incomes = Income.objects.none()

        # Apply filters
        source = request.query_params.get('source')
        amount = request.query_params.get('amount')
        description = request.query_params.get('description')
        start = request.query_params.get('start')
        end = request.query_params.get('end')

        if source:
            try:
                source_id = int(source)
                if not IncomeSource.objects.filter(id=source_id, club=request.user.club).exists():
                    return Response({"error": "No income source found with this ID in your club"}, status=status.HTTP_400_BAD_REQUEST)
                incomes = incomes.filter(source_id=source_id)
            except ValueError:
                return Response({"error": "Invalid source ID format"}, status=status.HTTP_400_BAD_REQUEST)
        
        if amount:
            try:
                incomes = incomes.filter(amount=float(amount))
            except ValueError:
                return Response({"error": "Invalid amount format"}, status=status.HTTP_400_BAD_REQUEST)
        
        if description:
            incomes = incomes.filter(description__icontains=description)

        if start and end:
            try:
                start_date = datetime.strptime(start, '%Y-%m-%d').date()
                end_date = datetime.strptime(end, '%Y-%m-%d').date()
                if request.user.role not in ['owner', 'admin']:
                    if start_date < attendance.check_in.date() or end_date > timezone.now().date():
                        return Response({'error': 'Date range must be within your shift.'}, status=status.HTTP_400_BAD_REQUEST)
                incomes = incomes.filter(date__range=[start_date, end_date])
            except ValueError:
                return Response({'error': 'Invalid date format for start or end. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        elif start or end:
            return Response({'error': 'Both start and end dates are required.'}, status=status.HTTP_400_BAD_REQUEST)

        incomes = incomes.order_by('-id')
        serializer = IncomeSerializer(incomes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def generate_daily_report_pdf(request):
    try:
        employee_id = request.query_params.get('employee_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        # Check employee permissions
        if request.user.role not in ['owner', 'admin']:
            if employee_id and str(employee_id) != str(request.user.id):
                return Response({'error': 'غير مسموح لك بمشاهدة تقارير موظف آخر'}, status=status.HTTP_403_FORBIDDEN)
            employee_id = request.user.id 

        # Validate employee existence
        if employee_id:
            employee = get_object_or_404(User, id=employee_id)
            if employee.club != request.user.club:
                return Response({'error': 'Employee not in your club'}, status=status.HTTP_403_FORBIDDEN)
        else:
            employee = None

        # Determine time period and shift date
        shift_date = "غير محدد"
        if not start_date or not end_date:
            if request.user.role in ['owner', 'admin']:
                # Admin/Owner: Default to current day
                start_date = timezone.now().date().isoformat()
                end_date = timezone.now().isoformat()
            else:
                # Employee: Report for open shift
                attendance = StaffAttendance.objects.filter(
                    staff=request.user,
                    club=request.user.club,
                    check_out__isnull=True
                ).order_by('-check_in').first()
                if not attendance:
                    return Response({'error': 'لا توجد وردية مفتوحة. يجب تسجيل حضور أولاً.'}, status=status.HTTP_404_NOT_FOUND)
                start_date = attendance.check_in.isoformat()
                end_date = timezone.now().isoformat()
                employee_id = request.user.id 
                shift_date = f"من {attendance.check_in.strftime('%Y-%m-%d %H:%M:%S')} " + \
                            (f"إلى {attendance.check_out.strftime('%Y-%m-%d %H:%M:%S')}" if attendance.check_out else "مستمر")
        else:
            # If Admin/Owner specified dates, fetch shift date if applicable
            if employee_id:
                attendance = StaffAttendance.objects.filter(
                    staff=employee,
                    club=request.user.club,
                    check_in__lte=end_date,
                    check_out__gte=start_date
                ).order_by('-check_in').first()
                if attendance:
                    shift_date = f"من {attendance.check_in.strftime('%Y-%m-%d %H:%M:%S')} " + \
                                (f"إلى {attendance.check_out.strftime('%Y-%m-%d %H:%M:%S')}" if attendance.check_out else "مستمر")

        # Convert dates to datetime objects
        try:
            start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            return Response({'error': 'Invalid date format. Use ISO format (e.g., 2025-06-04T00:00:00Z)'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch data
        expenses = Expense.objects.select_related('category', 'paid_by').filter(
            club=request.user.club,
            date__gte=start_date_obj,
            date__lte=end_date_obj
        )
        incomes = Income.objects.select_related('source', 'received_by').filter(
            club=request.user.club,
            date__gte=start_date_obj,
            date__lte=end_date_obj
        )

        if employee_id:
            expenses = expenses.filter(paid_by=employee)
            incomes = incomes.filter(received_by=employee)

        # Calculate totals and counts
        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0
        total_incomes = incomes.aggregate(total=Sum('amount'))['total'] or 0
        net_profit = total_incomes - total_expenses
        expenses_count = expenses.count()
        incomes_count = incomes.count()

        # Prepare report data
        report_data = {
            'employee_name': employee.username if employee else 'جميع الموظفين',
            'start_date': start_date_obj.strftime('%Y-%m-%d %H:%M:%S'),
            'end_date': end_date_obj.strftime('%Y-%m-%d %H:%M:%S'),
            'shift_date': shift_date,
            'print_date': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
            'expenses': [
                {
                    'date': expense.date.strftime('%Y-%m-%d %H:%M:%S'),
                    'category': expense.category.name,
                    'amount': f"{expense.amount:.2f}"
                } for expense in expenses
            ],
            'incomes': [
                {
                    'date': income.date.strftime('%Y-%m-%d %H:%M:%S'),
                    'source': income.source.name,
                    'amount': f"{income.amount:.2f}"
                } for income in incomes
            ],
            'expenses_count': expenses_count,
            'incomes_count': incomes_count,
            'total_expenses': f"{total_expenses:.2f}",
            'total_incomes': f"{total_incomes:.2f}",
            'net_profit': f"{net_profit:.2f}"
        }

        # Load LaTeX template
        latex_template_path = os.path.join(os.path.dirname(__file__), 'templates', 'daily_report.tex')
        with open(latex_template_path, 'r', encoding='utf-8') as file:
            template = Template(file.read())

        # Render template with data
        latex_content = template.render(**report_data)

        # Create temporary LaTeX file
        with tempfile.TemporaryDirectory() as tmpdirname:
            latex_file_path = os.path.join(tmpdirname, 'report.tex')
            with open(latex_file_path, 'w', encoding='utf-8') as f:
                f.write(latex_content)

            # Run pdflatex to generate PDF
            result = subprocess.run(
                ['pdflatex', '-output-directory', tmpdirname, latex_file_path],
                capture_output=True, text=True
            )
            if result.returncode != 0:
                return Response({'error': 'Failed to generate PDF: ' + result.stderr}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Return PDF file
            pdf_file_path = os.path.join(tmpdirname, 'report.pdf')
            with open(pdf_file_path, 'rb') as pdf_file:
                response = FileResponse(pdf_file, content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="daily_report_{employee_id or "all"}_{start_date_obj.strftime("%Y%m%d")}.pdf"'
                return response

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncYear

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def financial_analysis_api(request):
    try:
        if request.user.role not in ['owner', 'admin']:
            return Response({'error': 'Only owners and admins can view financial analysis'}, status=status.HTTP_403_FORBIDDEN)

        period_type = request.query_params.get('period_type', 'monthly')
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        user_param = request.query_params.get('user')
        category_param = request.query_params.get('category')
        source_param = request.query_params.get('source')
        details = request.query_params.get('details', 'false').lower() == 'true'

        valid_periods = ['daily', 'weekly', 'monthly', 'yearly']
        if period_type not in valid_periods:
            return Response({'error': f'Invalid period_type. Use one of: {", ".join(valid_periods)}'}, status=status.HTTP_400_BAD_REQUEST)

        if start and end:
            try:
                start_date = datetime.strptime(start, '%Y-%m-%d').date()
                end_date = datetime.strptime(end, '%Y-%m-%d').date()
                if start_date > end_date:
                    return Response({'error': 'Start date must be before end date.'}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({'error': 'Invalid date format for start or end. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            end_date = timezone.now().date()
            if period_type == 'daily':
                start_date = end_date - timedelta(days=30)
            elif period_type == 'weekly':
                start_date = end_date - timedelta(weeks=12)
            elif period_type == 'monthly':
                start_date = end_date - relativedelta(months=12)
            else:
                start_date = end_date - relativedelta(years=5)

        income_qs = Income.objects.select_related('source', 'received_by').filter(
            club=request.user.club,
            date__range=[start_date, end_date]
        )
        expense_qs = Expense.objects.select_related('category', 'paid_by').filter(
            club=request.user.club,
            date__range=[start_date, end_date]
        )

        if user_param:
            user_obj = get_object_from_id_or_name(User, user_param, ['id', 'username'])
            if user_obj and user_obj.club == request.user.club:
                if request.user.role not in ['owner', 'admin'] and user_obj.id != request.user.id:
                    return Response({'error': 'You can only view your own data.'}, status=status.HTTP_403_FORBIDDEN)
                income_qs = income_qs.filter(received_by=user_obj)
                expense_qs = expense_qs.filter(paid_by=user_obj)
            else:
                return Response({'error': 'User not found or not in your club.'}, status=status.HTTP_400_BAD_REQUEST)

        if category_param:
            category_obj = get_object_from_id_or_name(ExpenseCategory, category_param, ['id', 'name'])
            if category_obj and category_obj.club == request.user.club:
                expense_qs = expense_qs.filter(category=category_obj)
            else:
                return Response({'error': 'Expense category not found or not in your club.'}, status=status.HTTP_400_BAD_REQUEST)

        if source_param:
            source_obj = get_object_from_id_or_name(IncomeSource, source_param, ['id', 'name'])
            if source_obj and source_obj.club == request.user.club:
                income_qs = income_qs.filter(source=source_obj)
            else:
                return Response({'error': 'Income source not found or not in your club.'}, status=status.HTTP_400_BAD_REQUEST)

        trunc_func = {
            'daily': TruncDay,
            'weekly': TruncWeek,
            'monthly': TruncMonth,
            'yearly': TruncYear
        }[period_type]

        income_by_period = income_qs.annotate(period=trunc_func('date')).values('period').annotate(
            total_income=Sum('amount')
        ).order_by('period')

        expense_by_period = expense_qs.annotate(period=trunc_func('date')).values('period').annotate(
            total_expense=Sum('amount')
        ).order_by('period')

        periods = {}
        for item in income_by_period:
            period_str = item['period']
            periods[period_str] = {
                'total_income': float(item['total_income']),
                'total_expense': 0,
                'net_profit': float(item['total_income'])
            }
        for item in expense_by_period:
            period_str = item['period']
            if period_str in periods:
                periods[period_str]['total_expense'] = float(item['total_expense'])
                periods[period_str]['net_profit'] = periods[period_str]['total_income'] - periods[period_str]['total_expense']
            else:
                periods[period_str] = {
                    'total_income': 0,
                    'total_expense': float(item['total_expense']),
                    'net_profit': -float(item['total_expense'])
                }

        total_income = income_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        total_expense = expense_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        net_profit = total_income - total_expense

        financial_position = {
            'total_income': float(total_income),
            'total_expense': float(total_expense),
            'net_profit': float(net_profit),
            'cash_balance': float(net_profit),
            'liabilities': float(total_expense)
        }

        prev_start_date = start_date - (end_date - start_date)
        prev_end_date = start_date - timedelta(days=1)
        prev_income = Income.objects.filter(
            club=request.user.club,
            date__range=[prev_start_date, prev_end_date]
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        prev_expense = Expense.objects.filter(
            club=request.user.club,
            date__range=[prev_start_date, prev_end_date]
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        prev_net = prev_income - prev_expense

        results = {
            'income_growth': float((total_income - prev_income) / prev_income * 100) if prev_income else 0,
            'expense_growth': float((total_expense - prev_expense) / prev_expense * 100) if prev_expense else 0,
            'net_profit_growth': float((net_profit - prev_net) / prev_net * 100) if prev_net else 0
        }

        period_count = Decimal(len(periods)) or Decimal('1')
        avg_income = total_income / period_count
        avg_expense = total_expense / period_count
        forecasts = {
            'next_period_income': float(avg_income),
            'next_period_expense': float(avg_expense),
            'next_period_net': float(avg_income - avg_expense)
        }

        expense_by_category = expense_qs.values('category__name').annotate(
            total_amount=Sum('amount')
        ).order_by('-total_amount')
        expense_category_analysis = [
            {
                'category': item['category__name'],
                'total_amount': float(item['total_amount']),
                'percentage': float(Decimal(item['total_amount']) / total_expense * 100) if total_expense else 0
            } for item in expense_by_category
        ]

        income_by_source = income_qs.values('source__name').annotate(
            total_amount=Sum('amount')
        ).order_by('-total_amount')
        income_source_analysis = [
            {
                'source': item['source__name'],
                'total_amount': float(item['total_amount']),
                'percentage': float(Decimal(item['total_amount']) / total_income * 100) if total_income else 0
            } for item in income_by_source
        ]

        top_expense_categories = expense_category_analysis[:5]
        top_income_sources = income_source_analysis[:5]

        alerts = []
        expense_ratio = total_expense / total_income if total_income > 0 else None
        if expense_ratio is not None and expense_ratio > Decimal('0.9'):
            alerts.append(f'تحذير: المصروفات تقترب من الإيرادات أو تتجاوزها (نسبة المصروفات: {float(expense_ratio):.2%})')
        if net_profit < 0:
            alerts.append(f'تحذير: صافي الربح سلبي ({float(net_profit):.2f})')
        for cat in expense_category_analysis:
            if cat['percentage'] > 30:
                alerts.append(f'تنبيه: فئة المصروفات "{cat["category"]}" تمثل {cat["percentage"]:.2f}% من إجمالي المصروفات')
        for src in income_source_analysis:
            if src['percentage'] < 10:
                alerts.append(f'تنبيه: مصدر الإيراد "{src["source"]}" يساهم بأقل من 10% ({src["percentage"]:.2f}%) من الإيرادات')

        recommendations = []
        if expense_ratio is not None and expense_ratio > Decimal('0.7'):
            high_expense_categories = [cat["category"] if cat["category"] else "غير مصنف" for cat in top_expense_categories]
            recommendations.append(
                f'اقتراح: حاول تقليل المصروفات، خاصة في الفئات ذات النسبة العالية مثل {", ".join(high_expense_categories)}'
            )

        low_income_sources = [src["source"] if src["source"] else "غير معروف" for src in income_source_analysis if src["percentage"] < 10]
        if low_income_sources:
            recommendations.append(
                f'اقتراح: ركز على زيادة الإيرادات من مصادر ضعيفة مثل {", ".join(low_income_sources)}'
            )

        if net_profit < 0:
            recommendations.append(
                'اقتراح: راجع استراتيجيات التسعير أو قلل المصروفات الغير ضرورية لتحسين صافي الربح'
            )

        response_data = {
            'period_analysis': [
                {
                    'period': period,
                    'total_income': data['total_income'],
                    'total_expense': data['total_expense'],
                    'net_profit': data['net_profit']
                } for period, data in periods.items()
            ],
            'financial_position': financial_position,
            'results': results,
            'forecasts': forecasts,
            'expense_category_analysis': expense_category_analysis,
            'income_source_analysis': income_source_analysis,
            'top_expense_categories': top_expense_categories,
            'top_income_sources': top_income_sources,
            'alerts': alerts,
            'recommendations': recommendations
        }

        if details:
            response_data['income_details'] = IncomeDetailSerializer(income_qs, many=True).data
            response_data['expense_details'] = ExpenseDetailSerializer(expense_qs, many=True).data

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error in financial_analysis_api: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)