# # from django import forms
# # from .models import Shift

# # class ShiftForm(forms.ModelForm):
# #     class Meta:
# #         model = Shift
# #         fields = ['club', 'staff', 'date', 'shift_start', 'shift_end', 'approved_by']
# #         widgets = {
# #             'club': forms.Select(attrs={'class': 'form-control'}),
# #             'staff': forms.Select(attrs={'class': 'form-control'}),
# #             'date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
# #             'shift_start': forms.TimeInput(attrs={'class': 'form-control', 'type': 'time'}),
# #             'shift_end': forms.TimeInput(attrs={'class': 'form-control', 'type': 'time'}),
# #             'approved_by': forms.Select(attrs={'class': 'form-control'}),
# #         }

# from django import forms
# from .models import Shift

# class ShiftForm(forms.ModelForm):
#     class Meta:
#         model = Shift
#         fields = ['club', 'staff', 'shift_end', 'approved_by']  
#         widgets = {
#             'club': forms.Select(attrs={'class': 'form-control'}),
#             'staff': forms.Select(attrs={'class': 'form-control'}),
#             'shift_end': forms.TimeInput(attrs={'class': 'form-control', 'type': 'time'}),
#             'approved_by': forms.Select(attrs={'class': 'form-control'}),
#         }
