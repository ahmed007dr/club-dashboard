from django.urls import path
from . import api

urlpatterns = [
    path('employee/<int:employee_id>/salary/', api.employee_salary_api, name='employee_salary'),
    path('employee/<int:employee_id>/salary/lock/', api.lock_salary_api, name='lock_salary'),
    path('employee/<int:employee_id>/update-details/', api.update_employee_details_api, name='update_employee_details'),
    path('employee/transaction/add/', api.add_employee_transaction_api, name='add_employee_transaction'),
    path('supplier/<int:supplier_id>/invoices/', api.supplier_invoices_api, name='supplier_invoices'),
    path('supplier/invoice/add/', api.add_supplier_invoice_api, name='add_supplier_invoice'),
]