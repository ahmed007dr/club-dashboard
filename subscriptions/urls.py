from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .api import SubscriptionViewSet, SubscriptionTypeViewSet

router = DefaultRouter()
router.register(r'subscription-types', SubscriptionTypeViewSet, basename='subscriptiontype')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('api/', include(router.urls)),
    path('subscriptions/', views.subscription_list, name='subscription_list'),
    path('subscriptions/add/', views.add_subscription, name='add_subscription'),
    path('subscriptions/<int:subscription_id>/edit/', views.edit_subscription, name='edit_subscription'),
    path('subscriptions/<int:subscription_id>/delete/', views.delete_subscription, name='delete_subscription'),
    path('subscriptions/<int:subscription_id>/', views.subscription_detail, name='subscription_detail'),
]