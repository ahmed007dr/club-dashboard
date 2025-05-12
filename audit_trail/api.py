from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from audit_trail.models import AuditLog, UserVisitLog
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'action', 'app_name', 'model_name', 'object_id', 'description', 'user', 'created_at']

class UserVisitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserVisitLog
        fields = ['id', 'user', 'login_time', 'logout_time', 'ip_address', 'device_info']

class LogPagination(PageNumberPagination):
    page_size = 50

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_log_list(request):
    logs = AuditLog.objects.all().order_by('-created_at')
    paginator = LogPagination()
    paginated_logs = paginator.paginate_queryset(logs, request)
    serializer = AuditLogSerializer(paginated_logs, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_visit_log_list(request):
    logs = UserVisitLog.objects.filter(user=request.user).order_by('-login_time')
    if request.user.role == 'owner':
        logs = UserVisitLog.objects.all().order_by('-login_time')
    paginator = LogPagination()
    paginated_logs = paginator.paginate_queryset(logs, request)
    serializer = UserVisitLogSerializer(paginated_logs, many=True)
    return paginator.get_paginated_response(serializer.data)