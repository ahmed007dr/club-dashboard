from django import forms
from .models import Subscription

class SubscriptionForm(forms.ModelForm):
    attendance_days = forms.IntegerField(required=False)  

    class Meta:
        model = Subscription
        fields = [
            'member',
            'type',
            'start_date',
            'end_date',
            'attendance_days',
            'paid_amount',
            'remaining_amount',
        ]
        widgets = {
            'member': forms.Select(attrs={'class': 'form-control'}),
            'type': forms.Select(attrs={'class': 'form-control'}),
            'start_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'end_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'attendance_days': forms.NumberInput(attrs={'class': 'form-control'}),
            'paid_amount': forms.NumberInput(attrs={'class': 'form-control'}),
            'remaining_amount': forms.NumberInput(attrs={'class': 'form-control'}),
        }
