from django.urls import path
from django.contrib.auth.decorators import login_required
from . import api, views

urlpatterns = [
    # === (Templates) ===
    path('club/profile/', login_required(views.club_profile), name='club-profile'),
    path('club/edit/', login_required(views.edit_club), name='edit-club'),
    
    # ===  API ===
    path('api/club/', login_required(api.api_club_profile), name='api-club-profile'),
    path('api/club/edit/', login_required(api.api_edit_club), name='api-edit-club'),
    
    # USERS
    path('api/user/profile/', login_required(api.api_user_profile), name='api-user-profile'),
    
]

# Authentication DRF
# from rest_framework_simplejwt.views import (
#     TokenObtainPairView,
#     TokenRefreshView,
# )

# urlpatterns += [
#     path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
#     path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
# ]