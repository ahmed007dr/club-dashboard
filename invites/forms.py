from django import forms
from .models import FreeInvite  # Import the model from models.py

class FreeInviteForm(forms.ModelForm):
    class Meta:
        model = FreeInvite  # Reference the model from models.py
        fields = ['club', 'guest_name', 'phone', 'date', 'status', 'invited_by', 'handled_by']
        widgets = {
            'club': forms.Select(attrs={'class': 'form-control'}),
            'guest_name': forms.TextInput(attrs={'class': 'form-control'}),
            'phone': forms.TextInput(attrs={'class': 'form-control'}),
            'date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'invited_by': forms.Select(attrs={'class': 'form-control'}),
            'handled_by': forms.Select(attrs={'class': 'form-control'}),
        }