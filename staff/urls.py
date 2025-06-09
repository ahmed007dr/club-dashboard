from django.urls import path
from . import api

urlpatterns = [
    # Shift Management APIs
    path('api/shifts/', api.shift_list_api, name='shift_list'),
    path('api/shifts/add/', api.add_shift_api, name='add_shift'),
    path('api/shifts/<int:shift_id>/', api.shift_detail_api, name='shift_detail'),
    path('api/shifts/<int:shift_id>/edit/', api.edit_shift_api, name='edit_shift'),
    path('api/shifts/<int:shift_id>/delete/', api.delete_shift_api, name='delete_shift'),
    path('api/staff/<int:staff_id>/shifts/', api.staff_shifts_api, name='staff_shifts'),
    # Attendance Management APIs
    path('api/check-in/', api.staff_check_in_by_code_api, name='staff_check_in'),
    path('api/check-out/', api.staff_check_out_by_code_api, name='staff_check_out'),
    path('api/attendance/<int:attendance_id>/', api.staff_attendance_analysis_api, name='attendance_analysis'),
    path('api/staff/<int:staff_id>/attendance/report/', api.staff_attendance_report_api, name='attendance_report'),
    path('api/attendance-report/', api.staff_attendance_report_api, name='all_attendance_report'),  
    path('api/staff-list/', api.staff_list_api, name='staff_list'),
    path('api/attendance/', api.attendance_list_api, name='attendance_list'),
    path('api/missing-checkins/', api.missing_checkins_api, name='missing_checkins'),
]
