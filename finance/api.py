from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Expense, Income, ExpenseCategory, IncomeSource
from .serializers import (
    ExpenseSerializer, IncomeSerializer,
    ExpenseCategorySerializer, IncomeSourceSerializer
)
from rest_framework.permissions import IsAuthenticated
from utils.permissions import IsOwnerOrRelatedToClub  
from rest_framework.pagination import PageNumberPagination
from datetime import datetime, timedelta

class StandardPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

# Expense Category Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def expense_category_api(request):
    if request.method == 'GET':
        if request.user.role == 'owner':
            categories = ExpenseCategory.objects.all() 
        else:
            categories = ExpenseCategory.objects.filter(club=request.user.club)  

        serializer = ExpenseCategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ExpenseCategorySerializer(data=request.data)
        if serializer.is_valid():
            category = serializer.save()
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, category):
                category.delete() 
                return Response({'error': 'You do not have permission to create an expense category for this club'}, status=status.HTTP_403_FORBIDDEN)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def expense_api(request):
    if request.method == 'GET':
        if request.user.role in ['owner', 'admin']:
            expenses = Expense.objects.select_related('category', 'paid_by').all()
        else:
            today = datetime.now().date()
            two_days_ago = today - timedelta(days=2) 
            expenses = Expense.objects.select_related('category', 'paid_by').filter(
                club=request.user.club,
                date__gte=two_days_ago
            )
        
        paginator = StandardPagination()
        page = paginator.paginate_queryset(expenses, request)
        serializer = ExpenseSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        data = request.data.copy()
        data['paid_by'] = request.user.id
        
        club_id = data.get('club')
        if club_id:
            from core.models import Club
            club = get_object_or_404(Club, id=club_id)
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, club):
                return Response({'error': 'You do not have permission to create an expense for this club'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ExpenseSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            expense = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Income Source Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsOwnerOrRelatedToClub])
def income_source_api(request):
    if request.method == 'GET':
        if request.user.role == 'owner':
            sources = IncomeSource.objects.all()
        else:
            sources = IncomeSource.objects.filter(club=request.user.club)

        serializer = IncomeSourceSerializer(sources, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = IncomeSourceSerializer(data=request.data)
        if serializer.is_valid():
            source = serializer.save()
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, source):
                source.delete()
                return Response({'error': 'You do not have permission to create an income source for this club'}, status=status.HTTP_403_FORBIDDEN)
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
            today = datetime.now().date()
            two_days_ago = today - timedelta(days=2)
            incomes = Income.objects.select_related('source', 'received_by').filter(
                club=request.user.club,
                date__gte=two_days_ago
            )
        
        paginator = StandardPagination()
        page = paginator.paginate_queryset(incomes, request)
        serializer = IncomeSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        data = request.data.copy()
        data['received_by'] = request.user.id
        
        club_id = data.get('club')
        if club_id:
            from core.models import Club
            club = get_object_or_404(Club, id=club_id)
            if not IsOwnerOrRelatedToClub().has_object_permission(request, None, club):
                return Response({'error': 'You do not have permission to create an income for this club'}, status=status.HTTP_403_FORBIDDEN)
        
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