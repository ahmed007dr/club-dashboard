from django import forms
from .models import Attendance

class AttendanceForm(forms.ModelForm):
    class Meta:
        model = Attendance
        fields = ['subscription']  
        widgets = {
            'subscription': forms.Select(attrs={'class': 'form-control'}),
        }
