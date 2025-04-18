from django.urls import path
from django.contrib.auth.decorators import login_required
from . import views, api

urlpatterns = [
    # ===== Template Views =====
    path('receipts/', login_required(views.receipt_list), name='receipt-list'),
    path('receipts/add/', login_required(views.add_receipt), name='add-receipt'),
    path('receipts/<int:receipt_id>/', login_required(views.receipt_detail), name='receipt-detail'),
    path('receipts/<int:receipt_id>/edit/', login_required(views.edit_receipt), name='edit-receipt'),
    path('receipts/<int:receipt_id>/delete/', login_required(views.delete_receipt), name='delete-receipt'),
    
    # ===== API Endpoints =====
    path('api/receipts/', api.receipt_list_api, name='api-receipt-list'),
    path('api/receipts/add/', api.add_receipt_api, name='api-add-receipt'),
    path('api/receipts/<int:receipt_id>/', api.receipt_detail_api, name='api-receipt-detail'),
    path('api/receipts/<int:receipt_id>/edit/', api.edit_receipt_api, name='api-edit-receipt'),
    path('api/receipts/<int:receipt_id>/delete/', api.delete_receipt_api, name='api-delete-receipt'),
    path('api/receipts/invoice/<str:invoice_number>/', api.receipt_by_invoice_api, name='api-receipt-by-invoice'),
]