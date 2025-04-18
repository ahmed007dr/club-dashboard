from django import forms
from .models import Expense, Income, ExpenseCategory, IncomeSource

# نموذج إضافة تصنيف مصروفات
class ExpenseCategoryForm(forms.ModelForm):
    class Meta:
        model = ExpenseCategory
        fields = ['club', 'name', 'description']
        widgets = {
            'club': forms.Select(attrs={'class': 'form-control'}),
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control'}),
        }

# نموذج إضافة مصروفات
class ExpenseForm(forms.ModelForm):
    class Meta:
        model = Expense
        fields = ['club', 'category', 'amount', 'description', 'date', 'paid_by', 'invoice_number', 'attachment']
        widgets = {
            'club': forms.Select(attrs={'class': 'form-control'}),
            'category': forms.Select(attrs={'class': 'form-control'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control'}),
            'date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'paid_by': forms.Select(attrs={'class': 'form-control'}),
            'invoice_number': forms.TextInput(attrs={'class': 'form-control'}),
            'attachment': forms.ClearableFileInput(attrs={'class': 'form-control'}),
        }

# نموذج إضافة مصدر دخل
class IncomeSourceForm(forms.ModelForm):
    class Meta:
        model = IncomeSource
        fields = ['club', 'name', 'description']
        widgets = {
            'club': forms.Select(attrs={'class': 'form-control'}),
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control'}),
        }

# نموذج إضافة إيرادات
class IncomeForm(forms.ModelForm):
    class Meta:
        model = Income
        fields = ['club', 'source', 'amount', 'description', 'date', 'received_by', 'related_receipt']
        widgets = {
            'club': forms.Select(attrs={'class': 'form-control'}),
            'source': forms.Select(attrs={'class': 'form-control'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control'}),
            'date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'received_by': forms.Select(attrs={'class': 'form-control'}),
            'related_receipt': forms.Select(attrs={'class': 'form-control'}),
        }
