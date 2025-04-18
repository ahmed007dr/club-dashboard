from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
# from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def home_view(request):
    return redirect('schema-swagger-ui')

schema_view = get_schema_view(
   openapi.Info(
      title="Club Management API",
      default_version='v1',
      description="API documentation for Club Management System",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="Dr.ahmed2022x@gmail.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('', home_view, name='home'),
    path('admin/', admin.site.urls),
    
    # # API Authentication
    # path('api/auth/', include([
    #     path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    #     path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    #     path('', include('rest_framework.urls')),
    # ])),
    
    # API Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API Endpoints
    path('api/v1/', include([
        path('members/', include('members.urls')),
        path('subscriptions/', include('subscriptions.urls')),
        path('tickets/', include('tickets.urls')),
        path('receipts/', include('receipts.urls')),
        path('staff/', include('staff.urls')),
        path('invites/', include('invites.urls')),
        path('finance/', include('finance.urls')),
        path('', include('core.urls')),
    ])),
]

# Static and media URL handling (development only)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Error handlers
handler404 = 'core.views.handler404'
handler500 = 'core.views.handler500'