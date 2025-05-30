from django.urls import path
from django.contrib.auth.decorators import login_required
from . import views, api

urlpatterns = [
    # ===== Template Views =====
    path('attendances/', login_required(views.attendance_list), name='attendance-list'),
    path('attendances/add/', login_required(views.add_attendance), name='add-attendance'),
    path('attendances/<int:attendance_id>/delete/', login_required(views.delete_attendance), name='delete-attendance'),
    
    # ===== Attendance API Endpoints =====
    path('api/attendances/', api.attendance_list_api, name='api-attendance-list'),
    path('api/attendances/heatmap/', api.attendance_heatmap_api, name='api-attendance-heatmap'),

    path('api/attendances/add/', api.add_attendance_api, name='api-add-attendance'),
    path('api/attendances/<int:attendance_id>/delete/', api.delete_attendance_api, name='api-delete-attendance'),
    
    # ===== EntryLog API Endpoints =====
    path('api/entry-logs/', api.entry_log_list_api, name='api-entry-log-list'),
    path('api/entry-logs/add/', api.create_entry_log_api, name='api-create-entry-log'),
]