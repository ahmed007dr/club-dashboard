from django import forms
from .models import Member

class MemberForm(forms.ModelForm):
    class Meta:
        model = Member
        fields = [
            'club',
            'name',  
            'membership_number',
            'national_id',
            'birth_date', 
            'phone',  
            'photo',
            'referred_by'
        ]
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'membership_number': forms.TextInput(attrs={'class': 'form-control'}),
            'national_id': forms.TextInput(attrs={'class': 'form-control'}),
            'birth_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'phone': forms.TextInput(attrs={'class': 'form-control'}),
            'referred_by': forms.Select(attrs={'class': 'form-control'}),
            'photo': forms.ClearableFileInput(attrs={'class': 'form-control-file'}),
        }