from django.contrib import admin
from .models import ExpenseCategory, Expense, IncomeSource, Income

admin.site.register(ExpenseCategory)
admin.site.register(Expense)
admin.site.register(IncomeSource)
admin.site.register(Income)
