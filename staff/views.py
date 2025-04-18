from django.shortcuts import render, get_object_or_404, redirect
from .models import Shift
from .forms import ShiftForm
from django.contrib import messages

# عرض جميع الورديات
def shift_list(request):
    shifts = Shift.objects.select_related('club', 'staff', 'approved_by').all()
    return render(request, 'staff/shift_list.html', {'shifts': shifts})

# إضافة وردية جديدة
def add_shift(request):
    if request.method == 'POST':
        form = ShiftForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "تم إضافة الورديه بنجاح.")
            return redirect('shift_list')
    else:
        form = ShiftForm()
    return render(request, 'staff/add_shift.html', {'form': form})

# تعديل وردية
def edit_shift(request, shift_id):
    shift = get_object_or_404(Shift, id=shift_id)
    if request.method == 'POST':
        form = ShiftForm(request.POST, instance=shift)
        if form.is_valid():
            form.save()
            messages.success(request, "تم تعديل الورديه بنجاح.")
            return redirect('shift_list')
    else:
        form = ShiftForm(instance=shift)
    return render(request, 'staff/edit_shift.html', {'form': form, 'shift': shift})

# حذف وردية
def delete_shift(request, shift_id):
    shift = get_object_or_404(Shift, id=shift_id)
    if request.method == 'POST':
        shift.delete()
        messages.success(request, "تم حذف الورديه بنجاح.")
        return redirect('shift_list')
    return render(request, 'staff/delete_shift.html', {'shift': shift})

# عرض تفاصيل وردية
def shift_detail(request, shift_id):
    shift = get_object_or_404(Shift, id=shift_id)
    return render(request, 'staff/shift_detail.html', {'shift': shift})
