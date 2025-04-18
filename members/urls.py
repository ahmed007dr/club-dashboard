from django.urls import path
from django.contrib.auth.decorators import login_required
from . import api, views

urlpatterns = [
    # ===== Template Views =====
    # Members
    path('members/', login_required(views.member_list), name='member-list'),
    path('members/add/', login_required(views.add_member), name='add-member'),
    path('members/<int:member_id>/', login_required(views.member_detail), name='member-detail'),
    path('members/<int:member_id>/edit/', login_required(views.edit_member), name='edit-member'),
    path('members/<int:member_id>/delete/', login_required(views.delete_member), name='delete-member'),

    # ===== API Endpoints =====
    # Members API
    path('api/members/', login_required(api.member_list_api), name='api-member-list'),
    path('api/members/create/', login_required(api.create_member_api), name='api-create-member'),
    path('api/members/<int:member_id>/', login_required(api.member_detail_api), name='api-member-detail'),
    path('api/members/<int:member_id>/update/', login_required(api.update_member_api), name='api-update-member'),
    path('api/members/<int:member_id>/delete/', login_required(api.delete_member_api), name='api-delete-member'),
    
    # Search
    path('api/members/search/', login_required(api.member_search_api), name='api-member-search'),
    
    # User Profile
    path('api/user/profile/', login_required(api.api_user_profile), name='api-user-profile'),

    # path('club/profile/', login_required(views.club_profile), name='club-profile'),
    # path('api/club/profile/', login_required(api.api_club_profile), name='api-club-profile'),

]

