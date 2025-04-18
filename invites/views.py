from django.shortcuts import render, get_object_or_404, redirect
from .models import FreeInvite
from .forms import FreeInviteForm
from django.contrib import messages

# عرض دعوات مجانية
def free_invite_list(request):
    invites = FreeInvite.objects.select_related('club', 'invited_by', 'handled_by').all()
    return render(request, 'invites/free_invite_list.html', {'invites': invites})

# إضافة دعوة مجانية
def add_free_invite(request):
    if request.method == 'POST':
        form = FreeInviteForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "تم إضافة الدعوة المجانية بنجاح.")
            return redirect('free_invite_list')
    else:
        form = FreeInviteForm()
    return render(request, 'invites/add_free_invite.html', {'form': form})

# تعديل دعوة مجانية
def edit_free_invite(request, invite_id):
    invite = get_object_or_404(FreeInvite, id=invite_id)
    if request.method == 'POST':
        form = FreeInviteForm(request.POST, instance=invite)
        if form.is_valid():
            form.save()
            messages.success(request, "تم تعديل الدعوة المجانية بنجاح.")
            return redirect('free_invite_list')
    else:
        form = FreeInviteForm(instance=invite)
    return render(request, 'invites/edit_free_invite.html', {'form': form, 'invite': invite})

# حذف دعوة مجانية
def delete_free_invite(request, invite_id):
    invite = get_object_or_404(FreeInvite, id=invite_id)
    if request.method == 'POST':
        invite.delete()
        messages.success(request, "تم حذف الدعوة المجانية بنجاح.")
        return redirect('free_invite_list')
    return render(request, 'invites/delete_free_invite.html', {'invite': invite})

# عرض تفاصيل دعوة مجانية
def free_invite_detail(request, invite_id):
    invite = get_object_or_404(FreeInvite, id=invite_id)
    return render(request, 'invites/free_invite_detail.html', {'invite': invite})
