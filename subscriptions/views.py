from django.shortcuts import render, get_object_or_404, redirect
from .models import Subscription
from .forms import SubscriptionForm
from django.contrib import messages

def subscription_list(request):
    subscriptions = Subscription.objects.select_related('member').all()
    return render(request, 'subscriptions/subscription_list.html', {'subscriptions': subscriptions})

def add_subscription(request):
    if request.method == 'POST':
        form = SubscriptionForm(request.POST)
        if form.is_valid():
            subscription = form.save(commit=False)
            subscription.remaining_amount = subscription.type.price - subscription.paid_amount
            subscription.save()
            messages.success(request, "تم إضافة الاشتراك بنجاح.")
            return redirect('subscription_list')
    else:
        form = SubscriptionForm()
    return render(request, 'subscriptions/add_subscription.html', {'form': form})

def edit_subscription(request, subscription_id):
    subscription = get_object_or_404(Subscription, id=subscription_id)
    if request.method == 'POST':
        form = SubscriptionForm(request.POST, instance=subscription)
        if form.is_valid():
            subscription = form.save(commit=False)
            #subscription.amount_remaining = subscription.subscription_value - subscription.amount_paid
            subscription.remaining_amount = subscription.type.price - subscription.paid_amount
            subscription.save()
            messages.success(request, "تم تعديل الاشتراك بنجاح.")
            return redirect('subscription_list')
    else:
        form = SubscriptionForm(instance=subscription)
    return render(request, 'subscriptions/edit_subscription.html', {'form': form, 'subscription': subscription})

def delete_subscription(request, subscription_id):
    subscription = get_object_or_404(Subscription, id=subscription_id)
    if request.method == 'POST':
        subscription.delete()
        messages.success(request, "تم حذف الاشتراك.")
        return redirect('subscription_list')
    return render(request, 'subscriptions/delete_subscription.html', {'subscription': subscription})

def subscription_detail(request, subscription_id):
    subscription = get_object_or_404(Subscription, id=subscription_id)
    return render(request, 'subscriptions/subscription_detail.html', {'subscription': subscription})
