from django.shortcuts import render, get_object_or_404, redirect
from .models import Ticket
from .forms import TicketForm
from django.contrib import messages

# عرض التذاكر
def ticket_list(request):
    tickets = Ticket.objects.select_related('club', 'used_by').all()
    return render(request, 'tickets/ticket_list.html', {'tickets': tickets})

# إضافة تذكرة جديدة
def add_ticket(request):
    if request.method == 'POST':
        form = TicketForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "تم إضافة التذكرة بنجاح.")
            return redirect('ticket_list')
    else:
        form = TicketForm()
    return render(request, 'tickets/add_ticket.html', {'form': form})

# تعديل تذكرة
def edit_ticket(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    if request.method == 'POST':
        form = TicketForm(request.POST, instance=ticket)
        if form.is_valid():
            form.save()
            messages.success(request, "تم تعديل التذكرة بنجاح.")
            return redirect('ticket_list')
    else:
        form = TicketForm(instance=ticket)
    return render(request, 'tickets/edit_ticket.html', {'form': form, 'ticket': ticket})

# حذف تذكرة
def delete_ticket(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    if request.method == 'POST':
        ticket.delete()
        messages.success(request, "تم حذف التذكرة بنجاح.")
        return redirect('ticket_list')
    return render(request, 'tickets/delete_ticket.html', {'ticket': ticket})

# عرض تفاصيل التذكرة
def ticket_detail(request, ticket_id):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    return render(request, 'tickets/ticket_detail.html', {'ticket': ticket})
