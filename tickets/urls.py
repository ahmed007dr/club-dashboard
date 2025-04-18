from django.urls import path
from django.contrib.auth.decorators import login_required
from . import views, api

urlpatterns = [
    # ===== Template Views =====
    path('tickets/', login_required(views.ticket_list), name='ticket-list'),
    path('tickets/add/', login_required(views.add_ticket), name='add-ticket'),
    path('tickets/<int:ticket_id>/', login_required(views.ticket_detail), name='ticket-detail'),
    path('tickets/<int:ticket_id>/edit/', login_required(views.edit_ticket), name='edit-ticket'),
    path('tickets/<int:ticket_id>/delete/', login_required(views.delete_ticket), name='delete-ticket'),
    
    # ===== API Endpoints =====
    path('api/tickets/', api.ticket_list_api, name='api-ticket-list'),
    path('api/tickets/add/', api.add_ticket_api, name='api-add-ticket'),
    path('api/tickets/<int:ticket_id>/', api.ticket_detail_api, name='api-ticket-detail'),
    path('api/tickets/<int:ticket_id>/edit/', api.edit_ticket_api, name='api-edit-ticket'),
    path('api/tickets/<int:ticket_id>/delete/', api.delete_ticket_api, name='api-delete-ticket'),
    path('api/tickets/<int:ticket_id>/mark-used/', api.mark_ticket_used_api, name='api-mark-ticket-used'),
]