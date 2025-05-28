from django.urls import path
from . import views, api
from django.contrib.auth.decorators import login_required

urlpatterns = [
    # Template Views
    path('subscriptions/', login_required(views.subscription_list), name='subscription_list'),
    path('subscriptions/add/', login_required(views.add_subscription), name='add_subscription'),
    path('subscriptions/<int:subscription_id>/edit/', login_required(views.edit_subscription), name='edit_subscription'),
    path('subscriptions/<int:subscription_id>/delete/', login_required(views.delete_subscription), name='delete_subscription'),
    path('subscriptions/<int:subscription_id>/', login_required(views.subscription_detail), name='subscription_detail'),
    
    # API Endpoints
    # Subscription Types
    path('api/subscription-types/', api.subscription_type_list, name='api-subscription-type-list'),
    path('api/subscription-types/<int:pk>/', api.subscription_type_detail, name='api-subscription-type-detail'),
    path('api/subscription-types/active/', api.active_subscription_types, name='api-active-subscription-types'),
    
    # Subscriptions
    path('api/subscriptions/', api.subscription_list, name='api-subscription-list'),
    path('api/subscriptions/<int:pk>/', api.subscription_detail, name='api-subscription-detail'),
    path('api/subscriptions/active/', api.active_subscriptions, name='api-active-subscriptions'),
    path('api/subscriptions/expired/', api.expired_subscriptions, name='api-expired-subscriptions'),
    path('api/subscriptions/upcoming/', api.upcoming_subscriptions, name='api-upcoming-subscriptions'),
    path('api/subscriptions/<int:pk>/renew/', api.renew_subscription, name='api-renew-subscription'),
    path('api/subscriptions/<int:pk>/make-payment/', api.make_payment, name='api-make-payment'),
    path('api/subscriptions/member/', api.member_subscriptions, name='api-member-subscriptions'),
    path('api/subscriptions/stats/', api.subscription_stats, name='api-subscription-stats'),
    
]