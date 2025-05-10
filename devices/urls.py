from django.urls import path
from . import views

app_name = 'devices'

urlpatterns = [
    path('', views.device_list, name='device_list'),
    path('not-authorized/', views.device_not_authorized, name='device_not_authorized'),
]