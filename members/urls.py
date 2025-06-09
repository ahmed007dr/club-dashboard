from django.urls import path
from django.contrib.auth.decorators import login_required
from . import api, views

urlpatterns = [
    # ===== Template Views =====
    path('members/', login_required(views.member_list), name='member-list'),
    path('members/add/', login_required(views.add_member), name='add-member'),
    path('members/<int:member_id>/', login_required(views.member_detail), name='member-detail'),
    path('members/<int:member_id>/edit/', login_required(views.edit_member), name='edit-member'),
    path('members/<int:member_id>/delete/', login_required(views.delete_member), name='member-detail'),

    # ===== API Endpoints (JWT Protected from inside views) =====
    path('api/members/', api.member_list_api, name='api-member-list'),
    path('api/members/create/', api.create_member_api, name='api-create-member'),
    path('api/members/<int:member_id>/', api.member_detail_api, name='api-member-detail'),
    path('api/members/<int:member_id>/update/', api.update_member_api, name='api-update-member'),
    path('api/members/<int:member_id>/delete/', api.delete_member_api, name='api-delete-member'),

    path('api/members/search/', api.member_search_api, name='api-member-search'),
    path('api/user/profile/', api.api_user_profile, name='api-user-profile'),
    path('api/members/subscription-report/', api.member_subscription_report_api, name='member_subscription_report_api'),
    path('api/members/export-subscription-report/', api.member_subscription_report_api, name='member_subscription_report_api'),

]
