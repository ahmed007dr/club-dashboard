# accounts/urls.py

from django.urls import path
from .views import custom_login_view
from . import api

urlpatterns = [
    path('login/', custom_login_view, name='login'),

    
    # API
    path('api/profile/', api.api_user_profile, name='api-user-profile'),

]
