import os
import subprocess
import logging
import tempfile
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.db.models import Sum, Q, Count
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncYear, TruncHour
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from jinja2 import Template
from decimal import Decimal
from accounts.models import User
from staff.models import StaffAttendance
from .models import Expense, Income, ExpenseCategory, IncomeSource, StockTransaction, StockItem, Schedule
from .serializers import (
    ExpenseSerializer, IncomeSerializer, ExpenseCategorySerializer, IncomeSourceSerializer,
    ExpenseDetailSerializer, IncomeDetailSerializer, IncomeSummarySerializer, StockItemSerializer, ScheduleSerializer
)
from utils.convert_to_name import get_object_from_id_or_name
from utils.reports import get_employee_report_data

logger = logging.getLogger(__name__)

FULL_ACCESS_ROLES = ['owner', 'admin']

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 20

def apply_common_filters(queryset, request, user_field=None, source_category_field=None):
    query_params = request.query_params
    applied_filters = []

    # Prevent conflicting date and start/end filters
    if query_params.get('date') and (query_params.get('start_date') or query_params.get('end_date')):
        raise ValueError('لا يمكن استخدام "date" مع "start_date" أو "end_date" في نفس الطلب.')

    # Filter by specific date or datetime
    if query_params.get('date'):
        try:
            date_input = query_params.get('date')
            # Try parsing as full datetime (YYYY-MM-DD HH:MM:SS)
            try:
                date_obj = datetime.strptime(date_input, '%Y-%m-%d %H:%M:%S')
                date_obj = timezone.make_aware(date_obj)  # Ensure timezone-aware
                queryset = queryset.filter(date=date_obj)
                applied_filters.append(f"date={date_obj}")
            except ValueError:
                # Fallback to date only (YYYY-MM-DD), filter for the whole day
                date_obj = datetime.strptime(date_input, '%Y-%m-%d')
                start_of_day = timezone.make_aware(date_obj.replace(hour=0, minute=0, second=0))
                end_of_day = timezone.make_aware(date_obj.replace(hour=23, minute=59, second=59))
                queryset = queryset.filter(date__range=[start_of_day, end_of_day])
                applied_filters.append(f"date={date_input} (full day)")
        except ValueError:
            raise ValueError('صيغة التاريخ غير صحيحة (YYYY-MM-DD أو YYYY-MM-DD HH:MM:SS).')

    # Filter by datetime range
    if query_params.get('start_date') and query_params.get('end_date'):
        try:
            start_input = query_params.get('start_date')
            end_input = query_params.get('end_date')
            # Try parsing as full datetime
            try:
                start_date = datetime.strptime(start_input, '%Y-%m-%d %H:%M:%S')
                end_date = datetime.strptime(end_input, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                # Fallback to date only, assume full day
                start_date = datetime.strptime(start_input, '%Y-%m-%d').replace(hour=0, minute=0, second=0)
                end_date = datetime.strptime(end_input, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
            start_date = timezone.make_aware(start_date)  # Ensure timezone-aware
            end_date = timezone.make_aware(end_date)  # Ensure timezone-aware
            if start_date > end_date:
                raise ValueError('تاريخ البداية يجب أن يكون قبل تاريخ النهاية.')
            queryset = queryset.filter(date__range=[start_date, end_date])
            applied_filters.append(f"start_date={start_date}, end_date={end_date}")
        except ValueError:
            raise ValueError('صيغة التاريخ غير صحيحة (YYYY-MM-DD أو YYYY-MM-DD HH:MM:SS).')
    elif query_params.get('start_date') or query_params.get('end_date'):
        raise ValueError('تاريخي البداية والنهاية مطلوبان معًا.')

    # Filter by user, amount, description, source/category
    if query_params.get('user'):
        user_obj = get_object_from_id_or_name(User, query_params.get('user'), ['id', 'username'])
        if user_obj and user_obj.club == request.user.club:
            queryset = queryset.filter(**{user_field: user_obj})
            applied_filters.append(f"user={user_obj.username}")
        else:
            raise ValueError('المستخدم غير موجود أو غير مسموح.')

    if query_params.get('source') and source_category_field == 'source':
        source_obj = get_object_from_id_or_name(IncomeSource, query_params.get('source'), ['id', 'name'])
        if source_obj and source_obj.club == request.user.club:
            queryset = queryset.filter(source=source_obj)
            applied_filters.append(f"source={source_obj.name}")
        else:
            raise ValueError('مصدر الإيراد غير موجود.')
    elif query_params.get('category') and source_category_field == 'category':
        category_obj = get_object_from_id_or_name(ExpenseCategory, query_params.get('category'), ['id', 'name'])
        if category_obj and category_obj.club == request.user.club:
            queryset = queryset.filter(category=category_obj)
            applied_filters.append(f"category={category_obj.name}")
        else:
            raise ValueError('فئة المصروف غير موجودة.')

    if query_params.get('amount'):
        try:
            queryset = queryset.filter(amount=float(query_params.get('amount')))
            applied_filters.append(f"amount={query_params.get('amount')}")
        except ValueError:
            raise ValueError('صيغة المبلغ غير صحيحة.')

    if query_params.get('description'):
        queryset = queryset.filter(description__icontains=query_params.get('description'))
        applied_filters.append(f"description={query_params.get('description')}")

    logger.debug(f"Applied filters: {', '.join(applied_filters) if applied_filters else 'none'}")
    logger.debug(f"Number of records after filtering: {queryset.count()}")
    
    if queryset.exists():
        sample_fields = ['id', 'amount', 'date']
        if source_category_field == 'source':
            sample_fields.append('source__name')
        elif source_category_field == 'category':
            sample_fields.append('category__name')
        if user_field:
            sample_fields.append(f"{user_field}__username")
        sample_records = queryset[:5].values(*sample_fields)
        logger.debug(f"Sample records: {list(sample_records)}")
    
    return queryset

def calculate_totals(queryset, field='amount'):
    """
    Calculate the sum of a field in the queryset.
    Args:
        queryset: The queryset to aggregate.
        field: The field to sum (default: 'amount').
    Returns:
        Float value of the total.
    """
    total = queryset.aggregate(total=Sum(field))['total'] or 0
    logger.debug(f"Calculated total for {field}: {total} for {queryset.count()} records")
    return float(total)

def handle_response(data, details_queryset=None, details_serializer=None, details_key=None, status_code=status.HTTP_200_OK):
    """
    Handle response creation with optional details.
    Args:
        data: The main response data.
        details_queryset: Queryset for details (if any).
        details_serializer: Serializer for details (if any).
        details_key: Key for details in response data (if any).
        status_code: HTTP status code.
    Returns:
        Response object.
    """
    response_data = data.copy()
    if details_queryset and details_serializer and details_key:
        response_data[details_key] = details_serializer(details_queryset, many=True).data
    return Response(response_data, status=status_code)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def expense_category_api(request):
    """List or create expense categories, accessible to all authenticated users."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        categories = ExpenseCategory.objects.filter(club=request.user.club)
        
        if request.query_params.get('name'):
            categories = categories.filter(name__icontains=request.query_params.get('name'))
        if request.query_params.get('description'):
            categories = categories.filter(description__icontains=request.query_params.get('description'))
        
        categories = categories.order_by('-id')
        paginator = StandardPagination()
        page = paginator.paginate_queryset(categories, request)
        serializer = ExpenseCategorySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ExpenseCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(club=request.user.club)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def expense_api(request):
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        try:
            expenses = Expense.objects.select_related('category', 'paid_by').filter(club=request.user.club).only(
                'id', 'amount', 'date', 'category__name', 'paid_by__username', 'description', 'invoice_number'
            )
            
            # Apply default last 24 hours filter if no filters provided
            if not any(request.query_params.get(param) for param in ['date', 'start_date', 'end_date', 'category', 'user', 'amount', 'description']):
                if request.user.role not in FULL_ACCESS_ROLES:
                    attendance = StaffAttendance.objects.filter(
                        staff=request.user, club=request.user.club, check_out__isnull=True
                    ).order_by('-check_in').first()
                    if attendance:
                        expenses = expenses.filter(
                            paid_by=request.user,
                            date__gte=attendance.check_in,
                            date__lte=attendance.check_out or timezone.now()
                        )
                        logger.debug("Applied active shift filter for non-admin user")
                    else:
                        last_24_hours = timezone.now() - timedelta(hours=24)
                        expenses = expenses.filter(date__gte=last_24_hours)
                        logger.debug("Applied default last 24 hours filter for non-admin user")
                else:
                    last_24_hours = timezone.now() - timedelta(hours=24)
                    expenses = expenses.filter(date__gte=last_24_hours)
                    logger.debug("Applied default last 24 hours filter")
            
            # Apply common filters
            expenses = apply_common_filters(expenses, request, user_field='paid_by', source_category_field='category')
            
            expenses = expenses.order_by('-id')
            paginator = StandardPagination()
            page = paginator.paginate_queryset(expenses, request)
            serializer = ExpenseSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)    
    elif request.method == 'POST':
        data = request.data.copy()
        data['paid_by'] = request.user.id
        data['club'] = request.user.club.id
        
        # التحقق من وجود وردية مفتوحة
        attendance = StaffAttendance.objects.filter(
            staff=request.user, club=request.user.club, check_out__isnull=True
        ).order_by('-check_in').first()
        
        if not attendance:
            return Response({'error': 'لا توجد وردية مفتوحة. يجب تسجيل حضور أولاً.'}, status=status.HTTP_400_BAD_REQUEST)

        # اجعل تاريخ المصروف داخل فترة الوردية المفتوحة
        data['date'] = timezone.now().strftime('%Y-%m-%d %H:%M:%S')

        if 'related_employee' in data and data['related_employee']:
            try:
                related_employee = User.objects.get(id=data['related_employee'], club=request.user.club)
            except User.DoesNotExist:
                return Response({'error': 'الموظف المرتبط غير موجود'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ExpenseSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            expense_date = serializer.validated_data.get('date')
            if expense_date < attendance.check_in or expense_date > (attendance.check_out or timezone.now()):
                return Response({'error': 'تاريخ المصروف خارج فترة الوردية المفتوحة'}, status=status.HTTP_400_BAD_REQUEST)

            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def income_source_api(request):
    """قائمة أو إنشاء مصادر الإيرادات."""
    if not request.user.club:
        logger.error(f"المستخدم {request.user.username} غير مرتبط بنادي")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        sources = IncomeSource.objects.filter(club=request.user.club, price__gt=0)  # تصفية السعر > 0
        if request.query_params.get('name'):
            sources = sources.filter(name__icontains=request.query_params.get('name'))
        if request.query_params.get('description'):
            sources = sources.filter(description__icontains=request.query_params.get('description'))
        sources = sources.order_by('-id')
        paginator = StandardPagination()
        page = paginator.paginate_queryset(sources, request)
        serializer = IncomeSourceSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        data = request.data.copy()
        data['club'] = request.user.club.id
        data['created_by'] = request.user.id
        serializer = IncomeSourceSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def income_api(request):
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        try:
            incomes = Income.objects.select_related('source', 'received_by').filter(club=request.user.club).only(
                'id', 'amount', 'date', 'source__name', 'received_by__username', 'description', 'quantity'
            )
            
            # Apply default last 24 hours filter if no filters provided
            if not any(request.query_params.get(param) for param in ['date', 'start_date', 'end_date', 'source', 'user', 'amount', 'description']):
                if request.user.role not in FULL_ACCESS_ROLES:
                    attendance = StaffAttendance.objects.filter(
                        staff=request.user, club=request.user.club, check_out__isnull=True
                    ).order_by('-check_in').first()
                    if attendance:
                        incomes = incomes.filter(
                            received_by=request.user,
                            date__gte=attendance.check_in,
                            date__lte=attendance.check_out or timezone.now()
                        )
                        logger.debug("Applied active shift filter for non-admin user")
                    else:
                        last_24_hours = timezone.now() - timedelta(hours=24)
                        incomes = incomes.filter(date__gte=last_24_hours)
                        logger.debug("Applied default last 24 hours filter for non-admin user")
                else:
                    last_24_hours = timezone.now() - timedelta(hours=24)
                    incomes = incomes.filter(date__gte=last_24_hours)
                    logger.debug("Applied default last 24 hours filter")
            
            # Apply common filters
            incomes = apply_common_filters(incomes, request, user_field='received_by', source_category_field='source')
            
            incomes = incomes.order_by('-id')
            paginator = StandardPagination()
            page = paginator.paginate_queryset(incomes, request)
            serializer = IncomeSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    elif request.method == 'POST':
        data = request.data.copy()
        data['received_by'] = request.user.id
        data['club'] = request.user.club.id
        #data['date'] = timezone.now().isoformat() 
        #data['date'] = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        source_id = data.get('source')
        quantity = data.get('quantity', 1)
        if not source_id:
            return Response({'error': 'مصدر الإيراد مطلوب'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            source = IncomeSource.objects.get(id=source_id, club=request.user.club)
            quantity = int(quantity)
            if quantity <= 0:
                return Response({'error': 'الكمية يجب أن تكون أكبر من صفر'}, status=status.HTTP_400_BAD_REQUEST)
            data['amount'] = float(source.price * quantity)
            data['quantity'] = quantity
            if source.stock_item:
                if not source.stock_item.is_sellable:
                    return Response({'error': 'عنصر المخزون غير قابل للبيع'}, status=status.HTTP_400_BAD_REQUEST)
                if quantity > source.stock_item.current_quantity:
                    return Response({'error': 'الكمية المطلوبة غير متوفرة في المخزون'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                data['stock_item'] = None
        except IncomeSource.DoesNotExist:
            return Response({'error': 'معرف مصدر غير صالح'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'سعر أو كمية غير صالحة'}, status=status.HTTP_400_BAD_REQUEST)
        if 'description' not in data or not data['description']:
            data['description'] = ''
        serializer = IncomeSerializer(data=data)
        if serializer.is_valid():
            with transaction.atomic():
                income = serializer.save()
                if source.stock_item:
                    StockTransaction.objects.create(
                        stock_item=source.stock_item, transaction_type='CONSUME', quantity=quantity,
                        description=f'بيع عبر الإيراد #{income.id} - {data["description"]}', related_income=income,
                        created_by=request.user
                    )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def expense_detail_api(request, pk):
    """Retrieve, update, or delete an expense (Owner/Admin only for PUT/DELETE)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    expense = get_object_or_404(Expense, pk=pk, club=request.user.club)
    if request.method != 'GET' and request.user.role not in FULL_ACCESS_ROLES:
        return Response({'error': 'غير مسموح بالتعديل أو الحذف. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    if request.method == 'GET':
        serializer = ExpenseSerializer(expense, context={'request': request})
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = ExpenseSerializer(expense, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def income_detail_api(request, pk):
    """Retrieve, update, or delete an income (Owner/Admin only for PUT/DELETE)."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    income = get_object_or_404(Income, pk=pk, club=request.user.club)
    if request.method != 'GET' and request.user.role not in FULL_ACCESS_ROLES:
        return Response({'error': 'غير مسموح بالتعديل أو الحذف. يجب أن تكون Owner أو Admin.'}, status=status.HTTP_403_FORBIDDEN)
    if request.method == 'GET':
        serializer = IncomeSerializer(income)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = IncomeSerializer(income, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        income.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def income_summary(request):
    """Generate income summary with optional filters, default to last 24 hours if no filters provided."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        incomes = Income.objects.select_related('source', 'received_by').filter(club=request.user.club).only(
            'id', 'amount', 'date', 'source__name', 'received_by__username', 'description'
        )
        
        # Apply default last 24 hours filter if no filters provided
        if not any(request.query_params.get(param) for param in ['date', 'start_date', 'end_date', 'source', 'user', 'amount', 'description']):
            last_24_hours = timezone.now() - timedelta(hours=24)
            incomes = incomes.filter(date__gte=last_24_hours)
            logger.debug("Applied default last 24 hours filter")
        
        # Apply common filters
        incomes = apply_common_filters(incomes, request, user_field='received_by', source_category_field='source')
        
        # Calculate total
        total = calculate_totals(incomes)
        
        # Prepare response
        response_data = {'total_income': total}
        return handle_response(
            response_data,
            details_queryset=incomes if request.query_params.get('details', 'false').lower() == 'true' else None,
            details_serializer=IncomeSummarySerializer,
            details_key='details'
        )
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expense_summary(request):
    """Generate expense summary with optional filters, default to last 24 hours if no filters provided."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        expenses = Expense.objects.select_related('category', 'paid_by').filter(club=request.user.club).only(
            'id', 'amount', 'date', 'category__name', 'paid_by__username', 'description'
        )
        
        # Apply default last 24 hours filter if no filters provided
        if not any(request.query_params.get(param) for param in ['date', 'start_date', 'end_date', 'category', 'user', 'amount', 'description']):
            last_24_hours = timezone.now() - timedelta(hours=24)
            expenses = expenses.filter(date__gte=last_24_hours)
            logger.debug("Applied default last 24 hours filter")
        
        # Apply common filters
        expenses = apply_common_filters(expenses, request, user_field='paid_by', source_category_field='category')
        
        # Calculate total
        total = calculate_totals(expenses)
        
        # Prepare response
        response_data = {'total_expense': total}
        return handle_response(
            response_data,
            details_queryset=expenses if request.query_params.get('details', 'false').lower() == 'true' else None,
            details_serializer=ExpenseDetailSerializer,
            details_key='details'
        )
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def finance_overview(request):
    """Generate financial overview."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        income_qs = Income.objects.select_related('source', 'received_by').filter(club=request.user.club).only(
            'id', 'amount', 'date', 'source__name', 'received_by__username'
        )
        expense_qs = Expense.objects.select_related('category', 'paid_by').filter(club=request.user.club).only(
            'id', 'amount', 'date', 'category__name', 'paid_by__username'
        )
        
        # Apply common filters
        income_qs = apply_common_filters(income_qs, request, user_field='received_by', source_category_field='source')
        expense_qs = apply_common_filters(expense_qs, request, user_field='paid_by', source_category_field='category')
        
        # Calculate totals
        total_income = calculate_totals(income_qs)
        total_expense = calculate_totals(expense_qs)
        net = total_income - total_expense
        
        response_data = {
            'total_income': total_income,
            'total_expense': total_expense,
            'net_profit': net
        }
        return Response(response_data, status=status.HTTP_200_OK)
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expense_all_api(request):
    """List all expenses with optional filters."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        expenses = Expense.objects.select_related('category', 'paid_by').filter(club=request.user.club).only(
            'id', 'amount', 'date', 'category__name', 'paid_by__username', 'description'
        )
        
        # Apply filters
        expenses = apply_common_filters(expenses, request, user_field='paid_by', source_category_field='category')
        
        expenses = expenses.order_by('-id')
        serializer = ExpenseSerializer(expenses, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def income_all_api(request):
    """List all incomes with optional filters."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        incomes = Income.objects.select_related('source', 'received_by').filter(club=request.user.club).only(
            'id', 'amount', 'date', 'source__name', 'received_by__username', 'description'
        )
        
        # Apply filters
        incomes = apply_common_filters(incomes, request, user_field='received_by', source_category_field='source')
        
        incomes = incomes.order_by('-id')
        serializer = IncomeSerializer(incomes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_summary_api(request):
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        date_str = request.query_params.get('date')
        month_str = request.query_params.get('month')
        username = request.query_params.get('username')
        if date_str:
            try:
                # Try parsing as full datetime
                try:
                    filter_datetime = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                    date_filter = {'check_in__date': filter_datetime.date()}
                except ValueError:
                    # Fallback to date only, filter for the whole day
                    filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    date_filter = {'check_in__date': filter_date}
            except ValueError:
                return Response({'error': 'صيغة التاريخ غير صحيحة (YYYY-MM-DD أو YYYY-MM-DD HH:MM:SS)'}, status=status.HTTP_400_BAD_REQUEST)
        elif month_str:
            try:
                year, month = map(int, month_str.split('-'))
                date_filter = {'check_in__year': year, 'check_in__month': month}
            except ValueError:
                return Response({'error': 'صيغة الشهر غير صحيحة (YYYY-MM)'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            filter_date = timezone.now().date()
            date_filter = {'check_in__date': filter_date}
        club_filter = {'club': request.user.club}
        if username:
            employees = User.objects.filter(**club_filter, username=username)
            if not employees.exists():
                return Response({'error': 'الموظف غير موجود في ناديك.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            employees = User.objects.filter(**club_filter)
        summary = []
        for employee in employees:
            attendances = StaffAttendance.objects.filter(staff=employee, **club_filter, **date_filter)
            employee_summary = {
                'employee_id': employee.id, 'employee_name': employee.username, 'attendance_periods': [],
                'total_expenses': 0, 'total_incomes': 0, 'net': 0
            }
            for attendance in attendances:
                expenses = Expense.objects.filter(
                    **club_filter, paid_by=employee, 
                    date__gte=attendance.check_in, 
                    date__lte=attendance.check_out or timezone.now()
                )
                incomes = Income.objects.filter(
                    **club_filter, received_by=employee, 
                    date__gte=attendance.check_in, 
                    date__lte=attendance.check_out or timezone.now()
                )
                total_expenses = calculate_totals(expenses)
                total_incomes = calculate_totals(incomes)
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
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_daily_report_api(request):
    """Generate daily report for an employee based on their shift."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        logger.debug(f"Daily report request: User={request.user.username}, Role={request.user.role}, Params={request.query_params}")
        employee_id = request.query_params.get('employee_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if request.user.role not in FULL_ACCESS_ROLES:
            employee_id = request.user.id
        else:
            employee_id = employee_id if employee_id else request.user.id

        employee = get_object_or_404(User, id=employee_id, club=request.user.club)

        data, status_code = get_employee_report_data(
            user=request.user, employee_id=employee_id, start_date=start_date, end_date=end_date
        )
        return Response(data, status=status_code)
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_daily_report_pdf(request):
    """Generate a daily report PDF."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        employee_id = request.query_params.get('employee_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if not start_date or not end_date:
            start_date = timezone.now().date().isoformat()
            end_date = timezone.now().isoformat()
        if employee_id:
            employee = get_object_or_404(User, id=employee_id, club=request.user.club)
        try:
            start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            return Response({'error': 'صيغة التاريخ غير صحيحة (ISO format)'}, status=status.HTTP_400_BAD_REQUEST)
        expenses = Expense.objects.filter(club=request.user.club, date__gte=start_date_obj, date__lte=end_date_obj)
        incomes = Income.objects.filter(club=request.user.club, date__gte=start_date_obj, date__lte=end_date_obj)
        if employee_id:
            expenses = expenses.filter(paid_by=employee)
            incomes = incomes.filter(received_by=employee)
        total_expenses = calculate_totals(expenses)
        total_incomes = calculate_totals(incomes)
        net_profit = total_incomes - total_expenses
        expenses_count = expenses.count()
        incomes_count = incomes.count()
        report_data = {
            'employee_name': employee.username if employee_id else 'جميع الموظفين',
            'start_date': start_date_obj.strftime('%Y-%m-%d %H:%M:%S'),
            'end_date': end_date_obj.strftime('%Y-%m-%d %H:%M:%S'),
            'shift_date': 'غير محدد',
            'print_date': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
            'expenses': [
                {'date': expense.date.strftime('%Y-%m-%d %H:%M:%S'), 'category': expense.category.name, 'amount': f"{expense.amount:.2f}"}
                for expense in expenses
            ],
            'incomes': [
                {'date': income.date.strftime('%Y-%m-%d %H:%M:%S'), 'source': income.source.name, 'amount': f"{income.amount:.2f}"}
                for income in incomes
            ],
            'expenses_count': expenses_count, 'incomes_count': incomes_count,
            'total_expenses': f"{total_expenses:.2f}", 'total_incomes': f"{total_incomes:.2f}", 'net_profit': f"{net_profit:.2f}"
        }
        latex_template_path = os.path.join(os.path.dirname(__file__), 'templates', 'daily_report.tex')
        with open(latex_template_path, 'r', encoding='utf-8') as file:
            template = Template(file.read())
        latex_content = template.render(**report_data)
        with tempfile.TemporaryDirectory() as tmpdirname:
            latex_file_path = os.path.join(tmpdirname, 'report.tex')
            with open(latex_file_path, 'w', encoding='utf-8') as f:
                f.write(latex_content)
            result = subprocess.run(
                ['pdflatex', '-output-directory', tmpdirname, latex_file_path], capture_output=True, text=True
            )
            if result.returncode != 0:
                return Response({'error': 'فشل إنشاء PDF: ' + result.stderr}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            pdf_file_path = os.path.join(tmpdirname, 'report.pdf')
            with open(pdf_file_path, 'rb') as pdf_file:
                response = FileResponse(pdf_file, content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="daily_report_{employee_id or "all"}_{start_date_obj.strftime("%Y%m%d")}.pdf"'
                return response
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def financial_analysis_api(request):
    """Generate financial analysis."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        period_type = request.query_params.get('period_type', 'monthly')
        start = request.query_params.get('start_date')
        end = request.query_params.get('end_date')
        user_param = request.query_params.get('user')
        category_param = request.query_params.get('category')
        source_param = request.query_params.get('source')
        details = request.query_params.get('details', 'false').lower() == 'true'
        valid_periods = ['daily', 'weekly', 'monthly', 'yearly']
        if period_type not in valid_periods:
            return Response({'error': f'نوع الفترة غير صالح. استخدم: {", ".join(valid_periods)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        income_qs = Income.objects.filter(club=request.user.club).only('id', 'amount', 'date', 'source__name', 'received_by__username')
        expense_qs = Expense.objects.filter(club=request.user.club).only('id', 'amount', 'date', 'category__name', 'paid_by__username')
        
        # Apply filters
        if start and end:
            try:
                start_date = datetime.strptime(start, '%Y-%m-%d').date()
                end_date = datetime.strptime(end, '%Y-%m-%d').date()
                if start_date > end_date:
                    raise ValueError('تاريخ البداية يجب أن يكون قبل تاريخ النهاية.')
                income_qs = income_qs.filter(date__range=[start_date, end_date])
                expense_qs = expense_qs.filter(date__range=[start_date, end_date])
            except ValueError:
                raise ValueError('صيغة التاريخ غير صحيحة (YYYY-MM-DD)')
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
            income_qs = income_qs.filter(date__range=[start_date, end_date])
            expense_qs = expense_qs.filter(date__range=[start_date, end_date])
        
        income_qs = apply_common_filters(income_qs, request, user_field='received_by', source_category_field='source')
        expense_qs = apply_common_filters(expense_qs, request, user_field='paid_by', source_category_field='category')
        
        trunc_func = {
            'daily': TruncDay, 'weekly': TruncWeek, 'monthly': TruncMonth, 'yearly': TruncYear
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
            periods[period_str] = {'total_income': float(item['total_income']), 'total_expense': 0, 'net_profit': float(item['total_income'])}
        for item in expense_by_period:
            period_str = item['period']
            if period_str in periods:
                periods[period_str]['total_expense'] = float(item['total_expense'])
                periods[period_str]['net_profit'] = periods[period_str]['total_income'] - periods[period_str]['total_expense']
            else:
                periods[period_str] = {'total_income': 0, 'total_expense': float(item['total_expense']), 'net_profit': -float(item['total_expense'])}
        
        total_income = calculate_totals(income_qs)
        total_expense = calculate_totals(expense_qs)
        net_profit = total_income - total_expense
        
        financial_position = {
            'total_income': total_income,
            'total_expense': total_expense,
            'net_profit': net_profit,
            'cash_balance': net_profit,
            'liabilities': total_expense
        }
        
        prev_start_date = start_date - (end_date - start_date)
        prev_end_date = start_date - timedelta(days=1)
        prev_income = calculate_totals(Income.objects.filter(club=request.user.club, date__range=[prev_start_date, prev_end_date]))
        prev_expense = calculate_totals(Expense.objects.filter(club=request.user.club, date__range=[prev_start_date, prev_end_date]))
        prev_net = prev_income - prev_expense
        
        results = {
            'income_growth': float((total_income - prev_income) / prev_income * 100) if prev_income > 0 else 0,
            'expense_growth': float((total_expense - prev_expense) / prev_expense * 100) if prev_expense > 0 else 0,
            'net_profit_growth': float((net_profit - prev_net) / prev_net * 100) if prev_net > 0 else 0
        }
        
        period_count = Decimal(len(periods)) or Decimal('1')
        avg_income = total_income / period_count
        avg_expense = total_expense / period_count
        forecasts = {
            'next_period_income': float(avg_income),
            'next_period_expense': float(avg_expense),
            'next_period_net': float(avg_income - avg_expense)
        }
        
        expense_by_category = expense_qs.values('category__name').annotate(total_amount=Sum('amount')).order_by('-total_amount')
        expense_category_analysis = [
            {
                'category': item['category__name'],
                'total_amount': float(item['total_amount']),
                'percentage': float(Decimal(item['total_amount']) / total_expense * 100) if total_expense > 0 else 0
            } for item in expense_by_category
        ]
        
        income_by_source = income_qs.values('source__name').annotate(total_amount=Sum('amount')).order_by('-total_amount')
        income_source_analysis = [
            {
                'source': item['source__name'],
                'total_amount': float(item['total_amount']),
                'percentage': float(Decimal(item['total_amount']) / total_income * 100) if total_income > 0 else 0
            } for item in income_by_source
        ]
        
        top_expense_categories = expense_category_analysis[:5]
        top_income_sources = income_source_analysis[:5]
        
        alerts = []
        expense_ratio = total_expense / total_income if total_income > 0 else None
        if expense_ratio is not None and expense_ratio > Decimal('0.9'):
            alerts.append(f'تحذير: المصروفات تقترب من الإيرادات أو تتجاوزها (نسبة: {float(expense_ratio):.2%})')
        if net_profit < 0:
            alerts.append(f'تحذير: صافي الربح سلبي ({float(net_profit):.2f})')
        for cat in expense_category_analysis:
            if cat['percentage'] > 30:
                alerts.append(f'تنبيه: فئة "{cat["category"]}" تمثل {cat["percentage"]:.2f}% من المصروفات')
        for src in income_source_analysis:
            if src['percentage'] < 10:
                alerts.append(f'تنبيه: مصدر "{src["source"]}" يساهم بـ {src["percentage"]:.2f}% من الإيرادات')
        
        recommendations = []
        if expense_ratio is not None and expense_ratio > Decimal('0.7'):
            high_expense_categories = [cat["category"] for cat in top_expense_categories]
            recommendations.append(f'اقتراح: قلل المصروفات في الفئات العالية مثل {", ".join(high_expense_categories)}')
        low_income_sources = [src["source"] for src in income_source_analysis if src["percentage"] < 10]
        if low_income_sources:
            recommendations.append(f'اقتراح: زِد الإيرادات من مصادر مثل {", ".join(low_income_sources)}')
        if net_profit < 0:
            recommendations.append('اقتراح: راجع التسعير أو قلل المصروفات غير الضرورية')
        
        response_data = {
            'period_analysis': [
                {'period': period, 'total_income': data['total_income'], 'total_expense': data['total_expense'], 'net_profit': data['net_profit']}
                for period, data in periods.items()
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
        
        return handle_response(
            response_data,
            details_queryset=income_qs if details else None,
            details_serializer=IncomeDetailSerializer,
            details_key='income_details'
        )
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def stock_item_api(request):
    """List or create stock items."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        stock_items = StockItem.objects.filter(club=request.user.club)
        if request.query_params.get('name'):
            stock_items = stock_items.filter(name__icontains=request.query_params.get('name'))
        stock_items = stock_items.order_by('-id')
        paginator = StandardPagination()
        page = paginator.paginate_queryset(stock_items, request)
        serializer = StockItemSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        data = request.data.copy()
        data['club'] = request.user.club.id
        serializer = StockItemSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def stock_inventory_api(request):
    """List or perform stock inventory checks."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        stock_items = StockItem.objects.filter(club=request.user.club).annotate(
            total_added=Sum('transactions__quantity', filter=Q(transactions__transaction_type='ADD')),
            total_consumed=Sum('transactions__quantity', filter=Q(transactions__transaction_type='CONSUME'))
        )
        report_data = [
            {
                'id': item.id, 'name': item.name, 'unit': item.unit, 'current_quantity': item.current_quantity,
                'total_added': item.total_added or 0, 'total_consumed': item.total_consumed or 0
            } for item in stock_items
        ]
        return Response(report_data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        inventory_data = request.data.get('inventory', [])
        try:
            discrepancies = []
            with transaction.atomic():
                for item in inventory_data:
                    stock_item_id = item.get('stock_item_id')
                    actual_quantity = item.get('actual_quantity')
                    if not stock_item_id or actual_quantity is None:
                        return Response({'error': 'معرف عنصر المخزون والكمية الفعلية مطلوبان'}, status=status.HTTP_400_BAD_REQUEST)
                    stock_item = StockItem.objects.get(id=stock_item_id, club=request.user.club)
                    expected_quantity = stock_item.current_quantity
                    if actual_quantity != expected_quantity:
                        difference = actual_quantity - expected_quantity
                        transaction_type = 'ADD' if difference > 0 else 'CONSUME'
                        quantity = abs(difference)
                        StockTransaction.objects.create(
                            stock_item=stock_item, transaction_type=transaction_type, quantity=quantity,
                            description=f'تعديل الجرد اليومي: {"زيادة" if difference > 0 else "نقص"} بمقدار {quantity}',
                            created_by=request.user
                        )
                        discrepancies.append({
                            'stock_item': stock_item.name, 'expected_quantity': expected_quantity,
                            'actual_quantity': actual_quantity, 'difference': difference
                        })
            return Response({'message': 'تم تسجيل الجرد بنجاح', 'discrepancies': discrepancies}, status=status.HTTP_200_OK)
        except StockItem.DoesNotExist:
            return Response({'error': 'عنصر المخزون غير موجود'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error("Error processing inventory: %s", str(e))
            return Response({'error': 'حدث خطأ أثناء تسجيل الجرد'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stock_profit_api(request):
    """Calculate stock profit."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        stock_item_id = request.query_params.get('stock_item_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        stock_items = StockItem.objects.filter(club=request.user.club)
        if stock_item_id:
            stock_items = stock_items.filter(id=stock_item_id)
        if start_date and end_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'صيغة التاريخ غير صحيحة (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            start_date_obj = None
            end_date_obj = None
        report_data = []
        for item in stock_items:
            purchase_transactions = StockTransaction.objects.filter(stock_item=item, transaction_type='ADD')
            if start_date_obj and end_date_obj:
                purchase_transactions = purchase_transactions.filter(date__date__range=[start_date_obj, end_date_obj])
            total_purchase_cost = sum(tx.related_expense.amount if tx.related_expense else 0 for tx in purchase_transactions)
            total_purchase_quantity = sum(tx.quantity for tx in purchase_transactions)
            sale_transactions = StockTransaction.objects.filter(stock_item=item, transaction_type='CONSUME', related_income__isnull=False)
            if start_date_obj and end_date_obj:
                sale_transactions = sale_transactions.filter(date__date__range=[start_date_obj, end_date_obj])
            total_sale_revenue = sum(tx.related_income.amount if tx.related_income else 0 for tx in sale_transactions)
            total_sale_quantity = sum(tx.quantity for tx in sale_transactions)
            profit = total_sale_revenue - total_purchase_cost
            profit_per_unit = profit / total_sale_quantity if total_sale_quantity > 0 else 0
            report_data.append({
                'stock_item_id': item.id, 'stock_item_name': item.name, 'total_purchase_quantity': total_purchase_quantity,
                'total_purchase_cost': float(total_purchase_cost), 'total_sale_quantity': total_sale_quantity,
                'total_sale_revenue': float(total_sale_revenue), 'profit': float(profit), 'profit_per_unit': float(profit_per_unit)
            })
        return Response(report_data, status=status.HTTP_200_OK)
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stock_sales_analysis_api(request):
    """Generate stock sales analysis."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        stock_item_id = request.query_params.get('stock_item_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        period_type = request.query_params.get('period_type', 'monthly')
        valid_periods = ['daily', 'weekly', 'monthly', 'yearly']
        if period_type not in valid_periods:
            return Response({'error': f'نوع الفترة غير صالح. استخدم: {", ".join(valid_periods)}'}, status=status.HTTP_400_BAD_REQUEST)
        stock_items = StockItem.objects.filter(club=request.user.club)
        if stock_item_id:
            stock_items = stock_items.filter(id=stock_item_id)
        if start_date and end_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
                if start_date_obj > end_date_obj:
                    return Response({'error': 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية.'}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({'error': 'صيغة التاريخ غير صحيحة (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            end_date_obj = timezone.now().date()
            if period_type == 'daily':
                start_date_obj = end_date_obj - timedelta(days=30)
            elif period_type == 'weekly':
                start_date_obj = end_date_obj - timedelta(weeks=12)
            elif period_type == 'monthly':
                start_date_obj = end_date_obj - relativedelta(months=12)
            else:
                start_date_obj = end_date_obj - relativedelta(years=5)
        analysis_data = []
        for item in stock_items:
            transactions = StockTransaction.objects.filter(
                stock_item=item, transaction_type='CONSUME', related_income__isnull=False,
                date__date__range=[start_date_obj, end_date_obj]
            ).prefetch_related('related_income')
            trunc_func = {'daily': TruncDay, 'weekly': TruncWeek, 'monthly': TruncMonth, 'yearly': TruncYear}[period_type]
            sales_by_period = transactions.annotate(period=trunc_func('date')).values('period').annotate(
                total_quantity=Sum('quantity'), total_revenue=Sum('related_income__amount')
            ).order_by('period')
            sales_by_hour = transactions.annotate(hour=TruncHour('date')).values('hour').annotate(
                total_quantity=Sum('quantity'), total_revenue=Sum('related_income__amount')
            ).order_by('hour')
            total_quantity_sold = transactions.aggregate(total=Sum('quantity'))['total'] or 0
            total_revenue = transactions.aggregate(total=Sum('related_income__amount'))['total'] or 0
            days_in_period = (end_date_obj - start_date_obj).days + 1
            avg_daily_sales = total_quantity_sold / days_in_period if days_in_period > 0 else 0
            sales_status = 'غير معروف'
            if avg_daily_sales == 0:
                sales_status = 'لا مبيعات'
            elif avg_daily_sales < 1:
                sales_status = 'ضعيف (مبيعات نادرة)'
            elif avg_daily_sales < 5:
                sales_status = 'متوسط (مبيعات متقلبة)'
            else:
                sales_status = 'قوي (مبيعات مستمرة)'
            sale_gaps = []
            transaction_dates = transactions.values('date__date').distinct().order_by('date__date')
            prev_date = None
            for tx_date in transaction_dates:
                current_date = tx_date['date__date']
                if prev_date:
                    gap_days = (current_date - prev_date).days
                    if gap_days > 7:
                        sale_gaps.append({
                            'start_date': prev_date.isoformat(), 'end_date': current_date.isoformat(), 'gap_days': gap_days
                        })
                prev_date = current_date
            analysis_data.append({
                'stock_item_id': item.id, 'stock_item_name': item.name, 'total_quantity_sold': total_quantity_sold,
                'total_revenue': float(total_revenue), 'sales_status': sales_status, 'avg_daily_sales': float(avg_daily_sales),
                'sales_by_period': [
                    {'period': period['period'].isoformat(), 'total_quantity': period['total_quantity'],
                     'total_revenue': float(period['total_revenue'] or 0)} for period in sales_by_period
                ],
                'sales_by_hour': [
                    {'hour': hour['hour'].strftime('%Y-%m-%d %H:00:00'), 'total_quantity': hour['total_quantity'],
                     'total_revenue': float(hour['total_revenue'] or 0)} for hour in sales_by_hour
                ],
                'sale_gaps': sale_gaps
            })
        return Response(analysis_data, status=status.HTTP_200_OK)
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_inventory_pdf(request):
    """Generate inventory report PDF."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        stock_items = StockItem.objects.filter(club=request.user.club)
        if request.query_params.get('stock_item_id'):
            stock_items = stock_items.filter(id=request.query_params.get('stock_item_id'))
        report_data = {
            'items': [
                {'name': item.name, 'unit': item.unit, 'quantity': item.current_quantity}
                for item in stock_items
            ],
            'print_date': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
        }
        latex_template_path = os.path.join(os.path.dirname(__file__), 'templates', 'inventory_report.tex')
        with open(latex_template_path, 'r', encoding='utf-8') as file:
            template = Template(file.read())
        latex_content = template.render(**report_data)
        with tempfile.TemporaryDirectory() as tmpdirname:
            latex_file_path = os.path.join(tmpdirname, 'report.tex')
            with open(latex_file_path, 'w', encoding='utf-8') as f:
                f.write(latex_content)
            result = subprocess.run(
                ['pdflatex', '-output-directory', tmpdirname, latex_file_path], capture_output=True, text=True
            )
            if result.returncode != 0:
                return Response({'error': 'فشل إنشاء PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            pdf_file_path = os.path.join(tmpdirname, 'report.pdf')
            with open(pdf_file_path, 'rb') as pdf_file:
                response = FileResponse(pdf_file, content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="inventory_report_{timezone.now().strftime("%Y%m%d")}.pdf"'
                return response
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def schedule_api(request):
    """List or create schedules."""
    if not request.user.club:
        logger.error(f"User {request.user.username} has no associated club")
        return Response({'error': 'غير مسموح: المستخدم ليس مرتبط بنادي.'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        schedules = Schedule.objects.filter(club=request.user.club)
        return Response([{
            'id': s.id, 'title': s.title, 'start': s.start.isoformat(), 'end': s.end.isoformat(), 'type': s.type
        } for s in schedules], status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        data = request.data.copy()
        data['club'] = request.user.club.id
        data['created_by'] = request.user.id
        serializer = ScheduleSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)