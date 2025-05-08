from django.urls import path
from . import  api

urlpatterns = [
    
    # ===== API Endpoints =====
    path('api/free-invites/', api.free_invite_list_api, name='api-free-invite-list'),
    path('api/free-invites/add/', api.add_free_invite_api, name='api-add-free-invite'),
    path('api/free-invites/<int:invite_id>/', api.free_invite_detail_api, name='api-free-invite-detail'),
    path('api/free-invites/<int:invite_id>/edit/', api.edit_free_invite_api, name='api-edit-free-invite'),
    path('api/free-invites/<int:invite_id>/delete/', api.delete_free_invite_api, name='api-delete-free-invite'),
    path('api/free-invites/<int:invite_id>/mark-used/', api.mark_invite_used_api, name='api-mark-invite-used'),
]