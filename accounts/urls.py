# accounts/urls.py

from django.urls import path
from .views import custom_login_view
from . import api
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)


urlpatterns = [
    path('login/', custom_login_view, name='login'),

    # Authentication
    path('api/login/', api.api_login, name='api-login'),
    path('api/logout/', api.api_logout, name='api-logout'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API
    path('api/profile/', api.api_user_profile, name='api-user-profile'),
    path('api/users/', api.api_user_list, name='api_user_list'),
    path('api/login/rfid/', api.api_rfid_login, name='api_rfid_login'),

]