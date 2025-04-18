from django.shortcuts import render, get_object_or_404, redirect
from .models import Receipt
from .forms import ReceiptForm
from django.contrib import messages

# عرض الإيصالات
def receipt_list(request):
    receipts = Receipt.objects.select_related('club', 'member', 'subscription').all()
    return render(request, 'receipts/receipt_list.html', {'receipts': receipts})

# إضافة إيصال جديد
def add_receipt(request):
    if request.method == 'POST':
        form = ReceiptForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "تم إضافة الإيصال بنجاح.")
            return redirect('receipt_list')
    else:
        form = ReceiptForm()
    return render(request, 'receipts/add_receipt.html', {'form': form})

# تعديل إيصال
def edit_receipt(request, receipt_id):
    receipt = get_object_or_404(Receipt, id=receipt_id)
    if request.method == 'POST':
        form = ReceiptForm(request.POST, instance=receipt)
        if form.is_valid():
            form.save()
            messages.success(request, "تم تعديل الإيصال بنجاح.")
            return redirect('receipt_list')
    else:
        form = ReceiptForm(instance=receipt)
    return render(request, 'receipts/edit_receipt.html', {'form': form, 'receipt': receipt})

# حذف إيصال
def delete_receipt(request, receipt_id):
    receipt = get_object_or_404(Receipt, id=receipt_id)
    if request.method == 'POST':
        receipt.delete()
        messages.success(request, "تم حذف الإيصال بنجاح.")
        return redirect('receipt_list')
    return render(request, 'receipts/delete_receipt.html', {'receipt': receipt})

# عرض تفاصيل الإيصال
def receipt_detail(request, receipt_id):
    receipt = get_object_or_404(Receipt, id=receipt_id)
    return render(request, 'receipts/receipt_detail.html', {'receipt': receipt})
