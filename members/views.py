from django.shortcuts import render, get_object_or_404, redirect
from .models import Member
from .forms import MemberForm
from django.contrib import messages

def member_list(request):
    members = Member.objects.all()
    return render(request, 'members/member_list.html', {'members': members})

def add_member(request):
    if request.method == 'POST':
        form = MemberForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, "تم إضافة العضو بنجاح.")
            return redirect('member_list')
    else:
        form = MemberForm()
    return render(request, 'members/add_member.html', {'form': form})

def edit_member(request, member_id):
    member = get_object_or_404(Member, id=member_id)
    if request.method == 'POST':
        form = MemberForm(request.POST, request.FILES, instance=member)
        if form.is_valid():
            form.save()
            messages.success(request, "تم تعديل بيانات العضو.")
            return redirect('member_list')
    else:
        form = MemberForm(instance=member)
    return render(request, 'members/edit_member.html', {'form': form, 'member': member})

def delete_member(request, member_id):
    member = get_object_or_404(Member, id=member_id)
    if request.method == 'POST':
        member.delete()
        messages.success(request, "تم حذف العضو.")
        return redirect('member_list')
    return render(request, 'members/delete_member.html', {'member': member})

def member_detail(request, member_id):
    member = get_object_or_404(Member, id=member_id)
    return render(request, 'members/member_detail.html', {'member': member})
