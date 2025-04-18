from django.shortcuts import render, get_object_or_404, redirect
from .models import Expense, Income, ExpenseCategory, IncomeSource
from .forms import ExpenseForm, IncomeForm, ExpenseCategoryForm, IncomeSourceForm
from django.contrib import messages

# عرض تصنيفات المصروفات
def expense_category_list(request):
    categories = ExpenseCategory.objects.all()
    return render(request, 'finance/expense_category_list.html', {'categories': categories})

# إضافة تصنيف مصروفات
def add_expense_category(request):
    if request.method == 'POST':
        form = ExpenseCategoryForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "تم إضافة تصنيف المصروفات بنجاح.")
            return redirect('expense_category_list')
    else:
        form = ExpenseCategoryForm()
    return render(request, 'finance/add_expense_category.html', {'form': form})

# عرض المصروفات
def expense_list(request):
    expenses = Expense.objects.select_related('category', 'paid_by').all()
    return render(request, 'finance/expense_list.html', {'expenses': expenses})

# إضافة مصروفات
def add_expense(request):
    if request.method == 'POST':
        form = ExpenseForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, "تم إضافة المصروفات بنجاح.")
            return redirect('expense_list')
    else:
        form = ExpenseForm()
    return render(request, 'finance/add_expense.html', {'form': form})

# عرض مصادر الدخل
def income_source_list(request):
    sources = IncomeSource.objects.all()
    return render(request, 'finance/income_source_list.html', {'sources': sources})

# إضافة مصدر دخل
def add_income_source(request):
    if request.method == 'POST':
        form = IncomeSourceForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "تم إضافة مصدر الدخل بنجاح.")
            return redirect('income_source_list')
    else:
        form = IncomeSourceForm()
    return render(request, 'finance/add_income_source.html', {'form': form})

# عرض الإيرادات
def income_list(request):
    incomes = Income.objects.select_related('source', 'received_by').all()
    return render(request, 'finance/income_list.html', {'incomes': incomes})

# إضافة إيرادات
def add_income(request):
    if request.method == 'POST':
        form = IncomeForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "تم إضافة الإيرادات بنجاح.")
            return redirect('income_list')
    else:
        form = IncomeForm()
    return render(request, 'finance/add_income.html', {'form': form})
