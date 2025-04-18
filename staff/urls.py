from django.urls import path
from django.contrib.auth.decorators import login_required
from . import views, api

urlpatterns = [
    # ===== Template Views =====
    path('shifts/', login_required(views.shift_list), name='shift-list'),
    path('shifts/add/', login_required(views.add_shift), name='add-shift'),
    path('shifts/<int:shift_id>/', login_required(views.shift_detail), name='shift-detail'),
    path('shifts/<int:shift_id>/edit/', login_required(views.edit_shift), name='edit-shift'),
    path('shifts/<int:shift_id>/delete/', login_required(views.delete_shift), name='delete-shift'),
    
    # ===== API Endpoints =====
    path('api/shifts/', api.shift_list_api, name='api-shift-list'),
    path('api/shifts/add/', api.add_shift_api, name='api-add-shift'),
    path('api/shifts/<int:shift_id>/', api.shift_detail_api, name='api-shift-detail'),
    path('api/shifts/<int:shift_id>/edit/', api.edit_shift_api, name='api-edit-shift'),
    path('api/shifts/<int:shift_id>/delete/', api.delete_shift_api, name='api-delete-shift'),
    path('api/shifts/staff/<int:staff_id>/', api.staff_shifts_api, name='api-staff-shifts'),
]