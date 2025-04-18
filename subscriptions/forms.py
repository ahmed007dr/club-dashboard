from django import forms
from .models import Subscription

class SubscriptionForm(forms.ModelForm):
    class Meta:
        model = Subscription
        fields = [
            'member',
            'subscription_type',
            'sport_type',
            'start_date',
            'end_date',
            'attendance_days',
            'subscription_value',
            'amount_paid',
            'amount_remaining',
        ]
        widgets = {
            'member': forms.Select(attrs={'class': 'form-control'}),
            'subscription_type': forms.Select(attrs={'class': 'form-control'}),
            'sport_type': forms.Select(attrs={'class': 'form-control'}),
            'start_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'end_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'attendance_days': forms.NumberInput(attrs={'class': 'form-control'}),
            'subscription_value': forms.NumberInput(attrs={'class': 'form-control'}),
            'amount_paid': forms.NumberInput(attrs={'class': 'form-control'}),
            'amount_remaining': forms.NumberInput(attrs={'class': 'form-control'}),
        }
