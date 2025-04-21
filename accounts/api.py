from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.decorators import login_required
from .serializers import UserProfileSerializer


@api_view(['GET'])
@login_required
def api_user_profile(request):
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)
