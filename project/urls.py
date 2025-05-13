from django.contrib import admin
from django.urls import path, include,re_path
# from django.views.generic import TemplateView # c panel settings
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect  
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def home_view(request):
    return redirect("http://localhost:5173/login") # cancel for c panel settings

schema_view = get_schema_view(
   openapi.Info(
      title="Club Management API",
      default_version='v1',
      description="API documentation for Club Management System",
      contact=openapi.Contact(email="Dr.ahmed2022x@gmail.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('', home_view, name='home'),
    path('long-life-egypt2030/', admin.site.urls),
    
    # API Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    #access token 
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API Endpoints
    path('accounts/', include('accounts.urls')),
    path('members/', include('members.urls')),
    path('subscriptions/', include('subscriptions.urls')),
    path('tickets/', include('tickets.urls')),
    path('receipts/', include('receipts.urls')),
    path('staff/', include('staff.urls')),
    path('invites/', include('invites.urls')),
    path('finance/', include('finance.urls')),
    path('attendance/', include('attendance.urls')),
    path('core/', include('core.urls')),

]

# Static and media URL handling (development only)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# urlpatterns += [
#     re_path(r'^.*$', TemplateView.as_view(template_name="index.html")), # c panel settings
# ]

# Error handlers
handler404 = 'core.views.handler404'
handler500 = 'core.views.handler500'