import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Expense, Income, ExpenseCategory, IncomeSource
from .serializers import (
    ExpenseSerializer, IncomeSerializer,
    ExpenseCategorySerializer, IncomeSourceSerializer,
    ExpenseDetailSerializer, IncomeDetailSerializer,
    IncomeSummarySerializer
)
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub
from rest_framework.pagination import PageNumberPagination
from datetime import datetime
from staff.models import StaffAttendance
from django.db.models import Sum, Q
from django.utils import timezone
from accounts.models import User
from django.http import FileResponse
from jinja2 import Template
import logging
import os
import subprocess
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
            # Owner و Admin يشوفوا بس مصروفات ناديهم
            expenses = Expense.objects.select_related('category', 'paid_by').filter(
                club=request.user.club
            ).order_by('-id')
        else:
            # Reception و Accountant يشوفوا مصروفاتهم في الشيفت الأخير
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club
            ).order_by('-check_in').first()
            
            if attendance:
                check_out = attendance.check_out if attendance.check_out else datetime.now()
                expenses = Expense.objects.select_related('category', 'paid_by').filter(
                    club=request.user.club,
                    paid_by=request.user,
                    date__gte=attendance.check_in,
                    date__lte=check_out
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
        sources = IncomeSource.objects.filter(club=request.user.club).order_by('-id')

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
            # Owner و Admin يشوفوا بس إيرادات ناديهم
            incomes = Income.objects.select_related('source', 'received_by').filter(
                club=request.user.club
            )
        else:
            # Reception و Accountant يشوفوا إيراداتهم في الشيفت الأخير
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club
            ).order_by('-id').first()
            
            if attendance:
                check_out = attendance.check_out if attendance.check_out else datetime.now()
                incomes = Income.objects.select_related('source', 'received_by').filter(
                    club=request.user.club,
                    received_by=request.user,
                    date__gte=attendance.check_in,
                    date__lte=check_out
                )
            else:
                incomes = Income.objects.none()

        source = request.query_params.get('source')
        amount = request.query_params.get('amount')
        description = request.query_params.get('description')

        if source:
            if not IncomeSource.objects.filter(name__icontains=source, club=request.user.club).exists():
                return Response({"error": "No income source found with this name in your club"}, status=status.HTTP_400_BAD_REQUEST)
            incomes = incomes.filter(source__name__icontains=source)
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
        if club_id and int(club_id) != request.user.club.id:
            return Response({'error': 'You can only create incomes for your own club'}, status=status.HTTP_403_FORBIDDEN)
        
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
        if request.user.role == 'admin':
            return Response({'error': 'Admins cannot view expenses'}, status=status.HTTP_403_FORBIDDEN)
        if expense.club != request.user.club:
            return Response({'error': 'You can only view expenses for your own club'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role not in ['owner'] and expense.paid_by != request.user:
            return Response({'error': 'You can only view your own expenses'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ExpenseSerializer(expense, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        if request.user.role == 'admin':
            return Response({'error': 'Admins cannot update expenses'}, status=status.HTTP_403_FORBIDDEN)
        if expense.club != request.user.club:
            return Response({'error': 'You can only update expenses for your own club'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role not in ['owner'] and expense.paid_by != request.user:
            return Response({'error': 'You can only update your own expenses'}, status=status.HTTP_403_FORBIDDEN)
            
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
        if request.user.role == 'admin':
            return Response({'error': 'Admins cannot update incomes'}, status=status.HTTP_403_FORBIDDEN)
        if income.club != request.user.club:
            return Response({'error': 'You can only update incomes for your own club'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role not in ['owner'] and income.received_by != request.user:
            return Response({'error': 'You can only update your own incomes'}, status=status.HTTP_403_FORBIDDEN)
            
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
            # Owner و Admin يشوفوا كل إيرادات النادي
            incomes = Income.objects.select_related('source', 'received_by').filter(
                club=request.user.club
            )
        else:
            attendance = StaffAttendance.objects.filter(
                staff=request.user,
                club=request.user.club
            ).order_by('-check_in').first()
            
            if not attendance:
                return Response({'error': 'No open or recent shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

            check_out = attendance.check_out if attendance.check_out else timezone.now()
            incomes = Income.objects.select_related('source', 'received_by').filter(
                club=request.user.club,
                received_by=request.user,
                date__gte=attendance.check_in,
                date__lte=check_out
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
                    if start_date < attendance.check_in.date() or end_date > check_out.date():
                        return Response({'error': 'Date range must be within your shift.'}, status=status.HTTP_400_BAD_REQUEST)
                incomes = incomes.filter(date__range=[start_date, end_date])
            except ValueError:
                return Response({'error': 'Invalid date format for start or end. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        elif start or end:
            return Response({'error': 'Both start and end dates are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if user_param:
            user_obj = get_object_from_id_or_name(User, user_param, ['id', 'username'])
            if user_obj and user_obj.user.club == request.user.user.club:
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
                club=request.user.club
            ).order_by('-check_in').first()
            
            if not attendance:
                return Response({'error': 'No open or recent shift found. Please check in first.'}, status=status.HTTP_404_NOT_FOUND)

            check_out = attendance.check_out if attendance.check_out else timezone.now()
            expenses = Expense.objects.select_related('category', 'paid_by').filter(
                club=request.user.club,
                paid_by=request.user,
                date__gte=attendance.check_in,
                date__lte=check_out
            )

        # تطبيق الفلاتر
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
                    if start_obj < attendance.check_in.date() or end_obj > check_out.date():
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

        # حساب إجمالي المصروفات
        total = expenses.aggregate(total_amount=Sum('amount'))['total_amount'] or 0
        response_data = {'total_expense': float(total)}

        # إضافة التفاصيل إذا طُلبت
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
            return Response({'error': 'Employee not in your club'}, status=status.HTTP_403_FORBIDDEN)

    data, status_code = get_employee_report_data(
        user=request.user,
        employee_id=employee_id,
        start_date=start_date,
        end_date=end_date
    )
    return Response(data, status=status_code)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def generate_daily_report_pdf(request):
    employee_id = request.query_params.get('employee_id')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    if request.user.role not in ['owner', 'admin'] and (not start_date or not end_date):
        attendance = StaffAttendance.objects.filter(
            staff=request.user,
            club=request.user.club,
            check_out__isnull=True
        ).order_by('-check_in').first()
        if attendance:
            start_date = attendance.check_in.isoformat()
            end_date = timezone.now().isoformat()

    if employee_id:
        employee = get_object_or_404(User, id=employee_id)
        if employee.club != request.user.club:
            return Response({'error': 'Employee not in your club'}, status=status.HTTP_403_FORBIDDEN)

    data, response_status = get_employee_report_data(
        request.user,
        employee_id,
        start_date,
        end_date
    )
    if response_status != status.HTTP_200_OK:
        return Response(data, status=response_status)

    data['report_date'] = timezone.localtime(timezone.now()).strftime('%Y-%m-%d')

    template_path = 'templates/report_template.tex'
    if not os.path.exists(template_path):
        logger.error("Template file not found: %s", template_path)
        return Response({'error': 'قالب التقرير غير موجود'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    with open(template_path, 'r', encoding='utf-8') as file:
        template = Template(file.read())

    rendered = template.render(**data)

    temp_dir = 'temp'
    os.makedirs(temp_dir, exist_ok=True)
    tex_file = os.path.join(temp_dir, f'report_{request.user.id}.tex')
    pdf_file = os.path.join(temp_dir, f'report_{request.user.id}.pdf')

    with open(tex_file, 'w', encoding='utf-8') as f:
        f.write(rendered)

    try:
        subprocess.run([
            'latexmk', '-pdf', tex_file, '-outdir=' + temp_dir
        ], check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        logger.error("Failed to generate PDF: %s\nstdout: %s\nstderr: %s", e, e.stdout, e.stderr)
        return Response({'error': 'فشل في إنشاء ملف PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if not os.path.exists(pdf_file):
        logger.error("PDF file not created: %s", pdf_file)
        return Response({'error': 'ملف PDF لم يتم إنشاؤه'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    response = FileResponse(
        open(pdf_file, 'rb'),
        content_type='application/pdf',
        as_attachment=True,
        filename='daily_report.pdf'
    )

    try:
        os.remove(tex_file)
        os.remove(pdf_file)
    except Exception as e:
        logger.warning("Failed to clean up temporary files: %s", e)

    return response