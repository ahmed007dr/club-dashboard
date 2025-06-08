from django.urls import path
from . import api

urlpatterns = [
    path('api/tickets/', api.ticket_list_api, name='api-ticket-list'),
    path('api/tickets/add/', api.add_ticket_api, name='api-add-ticket'),
    path('api/tickets/<int:ticket_id>/', api.ticket_detail_api, name='api-ticket-detail'),
    path('api/tickets/<int:ticket_id>/delete/', api.delete_ticket_api, name='api-delete-ticket'),
    path('api/ticket-types/', api.ticket_type_list_api, name='api-ticket-type-list'),
]