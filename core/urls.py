from django.urls import path
from django.contrib.auth.decorators import login_required
from . import api, views

urlpatterns = [
    # === Templates ===
    path('club/profile/', login_required(views.club_profile), name='club-profile'),
    path('club/edit/', login_required(views.edit_club), name='edit-club'),

    # === API ===
    path('api/club/', api.api_club_profile, name='api-club-profile'),
    path('api/club/edit/', api.api_edit_club, name='api-edit-club'),
    path('api/switch-club/', api.api_switch_club, name='api-switch-club'),
    path('api/clubs-list/', api.api_list_clubs, name='api-list-clubs'),

]
