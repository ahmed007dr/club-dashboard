from django.urls import path
from django.contrib.auth.decorators import login_required
from . import views, api

urlpatterns = [
    # ===== Template Views =====
    path('expense-categories/', login_required(views.expense_category_list), name='expense-category-list'),
    path('expense-categories/add/', login_required(views.add_expense_category), name='add-expense-category'),
    path('expenses/', login_required(views.expense_list), name='expense-list'),
    path('expenses/add/', login_required(views.add_expense), name='add-expense'),
    path('income-sources/', login_required(views.income_source_list), name='income-source-list'),
    path('income-sources/add/', login_required(views.add_income_source), name='add-income-source'),
    path('incomes/', login_required(views.income_list), name='income-list'),
    path('incomes/add/', login_required(views.add_income), name='add-income'),
    
    # ===== API Endpoints =====
    path('api/expense-categories/', api.expense_category_api, name='api-expense-category'),
    path('api/expenses/', api.expense_api, name='api-expense'),
    path('api/expenses/<int:pk>/', api.expense_detail_api, name='api-expense-detail'),
    path('api/income-sources/', api.income_source_api, name='api-income-source'),
    path('api/incomes/', api.income_api, name='api-income'),
    path('api/incomes/<int:pk>/', api.income_detail_api, name='api-income-detail'),
]