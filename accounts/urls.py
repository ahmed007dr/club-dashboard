from django.urls import path
from . import api
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Authentication
    path('api/login/', api.api_login, name='api-login'),
    path('api/logout/', api.api_logout, name='api-logout'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API
    path('api/profile/', api.api_user_profile, name='api-user-profile'),
    path('api/users/', api.api_user_list, name='api-user-list'),
    path('api/users/create/', api.api_user_create, name='api-user-create'),
    path('api/users/<int:pk>/update/', api.api_user_update, name='api-user-update'),
    path('api/login/rfid/', api.api_rfid_login, name='api-rfid-login'),
    path('api/active-users/', api.active_users_api, name='api-active-users'),
    path('api/coaches/', api.coach_list, name='coach_list'),
    path('api/users_with_expenses/', api.api_users_with_expenses, name='api_users_with_expenses'),
    path('api/users_with_paid_expenses/', api.api_users_with_paid_expenses, name='api_users_with_paid_expenses'),
    path('api/users_with_related_expenses/', api.api_users_with_related_expenses, name='api_users_with_related_expenses'),
]