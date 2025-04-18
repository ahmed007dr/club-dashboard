from django.shortcuts import render, get_object_or_404, redirect
from .models import Attendance
from .forms import AttendanceForm
from django.contrib import messages

def attendance_list(request):
    attendances = Attendance.objects.select_related('subscription', 'subscription__member').order_by('-attendance_date')
    return render(request, 'attendances/attendance_list.html', {'attendances': attendances})

def add_attendance(request):
    if request.method == 'POST':
        form = AttendanceForm(request.POST)
        if form.is_valid():
            attendance = form.save()
            messages.success(request, "تم تسجيل الحضور بنجاح.")
            return redirect('attendance_list')
    else:
        form = AttendanceForm()
    return render(request, 'attendances/add_attendance.html', {'form': form})

def delete_attendance(request, attendance_id):
    attendance = get_object_or_404(Attendance, id=attendance_id)
    if request.method == 'POST':
        attendance.delete()
        messages.success(request, "تم حذف الحضور.")
        return redirect('attendance_list')
    return render(request, 'attendances/delete_attendance.html', {'attendance': attendance})
