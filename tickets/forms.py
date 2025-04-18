from django import forms
from .models import Ticket

class TicketForm(forms.ModelForm):
    class Meta:
        model = Ticket
        fields = ['club', 'buyer_name', 'ticket_type', 'price', 'used', 'used_by']
        widgets = {
            'club': forms.Select(attrs={'class': 'form-control'}),
            'buyer_name': forms.TextInput(attrs={'class': 'form-control'}),
            'ticket_type': forms.Select(attrs={'class': 'form-control'}),
            'price': forms.NumberInput(attrs={'class': 'form-control'}),
            'used': forms.CheckboxInput(attrs={'class': 'form-control'}),
            'used_by': forms.Select(attrs={'class': 'form-control'}),
        }
