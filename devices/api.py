from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ExtendedUserVisit
from user_visit.models import UserVisit

class UserActivityReport(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        visits = ExtendedUserVisit.objects.filter(user_visit__user=request.user).select_related('user_visit')
        data = [
            {
                'device_id': visit.user_visit.fingerprint,
                'login_time': visit.user_visit.timestamp,
                'session_duration': visit.session_duration,
                'ip_address': visit.user_visit.remote_addr,
            }
            for visit in visits
        ]
        return Response(data)



# from django.urls import path
# from .api import UserActivityReport

# urlpatterns = [
#     path('activity-report/', UserActivityReport.as_view(), name='activity-report'),
# ]