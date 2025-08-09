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
    path('api/daily-summary/', api.daily_summary_api, name='api_daily_summary'),
    path('api/income-summary/', api.income_summary, name='api-income-summary'),
    path('api/expense-summary/', api.expense_summary, name='api-expense-summary'),
    path('api/finance-overview/', api.finance_overview, name='api-finance-overview'),
    path('api/employee/daily-report/', api.employee_daily_report_api, name='employee_daily_report'),
    path('api/employee/daily-report/pdf/', api.generate_daily_report_pdf, name='generate_daily_report_pdf'),
    path('api/expense/all/', api.expense_all_api, name='expense_all_api'),
    path('api/income/all/', api.income_all_api, name='income_all_api'),
    path('api/financial-analysis/', api.financial_analysis_api, name='financial_analysis_api'),
    
    path('api/stock-items/', api.stock_item_api, name='api-stock-item'),
    path('api/stock-inventory/', api.stock_inventory_api, name='api-stock-inventory'),
    path('api/stock-profit/', api.stock_profit_api, name='api-stock-profit'),
    path('api/stock-sales-analysis/', api.stock_sales_analysis_api, name='api-stock-sales-analysis'),
    path('api/schedule/', api.schedule_api, name='schedule_api'),
    path('api/stock-inventory-pdf/', api.generate_inventory_pdf, name='generate_inventory_pdf'),
    path('api/open-cash-journal/', api.open_cash_journal, name='open_cash_journal'),
    path('api/close-cash-journal/', api.close_cash_journal, name='close_cash_journal'),
    path('api/cash-journals/', api.cash_journal_api, name='cash_journal_api'),
    ]
