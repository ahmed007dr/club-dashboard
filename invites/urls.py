from django.urls import path
from django.contrib.auth.decorators import login_required
from . import views, api

urlpatterns = [
    # ===== Template Views =====
    path('free-invites/', login_required(views.free_invite_list), name='free-invite-list'),
    path('free-invites/add/', login_required(views.add_free_invite), name='add-free-invite'),
    path('free-invites/<int:invite_id>/', login_required(views.free_invite_detail), name='free-invite-detail'),
    path('free-invites/<int:invite_id>/edit/', login_required(views.edit_free_invite), name='edit-free-invite'),
    path('free-invites/<int:invite_id>/delete/', login_required(views.delete_free_invite), name='delete-free-invite'),
    
    # ===== API Endpoints =====
    path('api/free-invites/', api.free_invite_list_api, name='api-free-invite-list'),
    path('api/free-invites/add/', api.add_free_invite_api, name='api-add-free-invite'),
    path('api/free-invites/<int:invite_id>/', api.free_invite_detail_api, name='api-free-invite-detail'),
    path('api/free-invites/<int:invite_id>/edit/', api.edit_free_invite_api, name='api-edit-free-invite'),
    path('api/free-invites/<int:invite_id>/delete/', api.delete_free_invite_api, name='api-delete-free-invite'),
    path('api/free-invites/<int:invite_id>/mark-used/', api.mark_invite_used_api, name='api-mark-invite-used'),
]