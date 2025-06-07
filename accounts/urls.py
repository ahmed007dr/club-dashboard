from django.urls import path
from .api import custom_login_view, api_login, api_logout, api_user_profile, api_rfid_login, active_users_api, UserListCreateView, UserUpdateView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', custom_login_view, name='login'),

    # Authentication
    path('api/login/', api_login, name='api-login'),
    path('api/logout/', api_logout, name='api-logout'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API
    path('api/profile/', api_user_profile, name='api-user-profile'),
    path('api/users/', UserListCreateView.as_view(), name='api-user-list-create'),
    path('api/users/<int:pk>/', UserUpdateView.as_view(), name='api-user-update'),
    path('api/login/rfid/', api_rfid_login, name='api-rfid-login'),
    path('api/active-users/', active_users_api, name='api-active-users'),
]