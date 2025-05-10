from django.shortcuts import render, get_object_or_404, redirect
from .models import Attendance
from .forms import AttendanceForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from subscriptions.models import Subscription

@login_required
def attendance_list(request):
    if request.user.role == 'owner':
        attendances = Attendance.objects.select_related('subscription', 'subscription__member').order_by('-attendance_date')
    else:
        attendances = Attendance.objects.select_related('subscription', 'subscription__member')\
            .filter(subscription__club=request.user.club).order_by('-attendance_date')
    return render(request, 'attendances/attendance_list.html', {'attendances': attendances})


@login_required
def add_attendance(request):
    if request.method == 'POST':
        form = AttendanceForm(request.POST)
        if form.is_valid():
            attendance = form.save(commit=False)

            if request.user.role != 'owner' and attendance.subscription.club != request.user.club:
                messages.error(request, "لا يمكنك تسجيل حضور لعضو خارج ناديك.")
                return redirect('attendance_list')

            attendance.save()
            messages.success(request, "تم تسجيل الحضور بنجاح.")
            return redirect('attendance_list')
    else:
        form = AttendanceForm()
    return render(request, 'attendances/add_attendance.html', {'form': form})


@login_required
def delete_attendance(request, attendance_id):
    attendance = get_object_or_404(Attendance, id=attendance_id)

    if request.user.role != 'owner' and attendance.subscription.club != request.user.club:
        messages.error(request, "لا يمكنك حذف حضور من نادي مختلف.")
        return redirect('attendance_list')

    if request.method == 'POST':
        attendance.delete()
        messages.success(request, "تم حذف الحضور.")
        return redirect('attendance_list')
    return render(request, 'attendances/delete_attendance.html', {'attendance': attendance})
