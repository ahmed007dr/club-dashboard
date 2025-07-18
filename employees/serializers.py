from rest_framework import serializers
from .models import Employee, EmployeeSalary, EmployeeTransaction, EmployeeFinancialRecord, Supplier, SupplierInvoice
from django.contrib.auth.models import Group

class EmployeeSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )

    class Meta:
        model = Employee
        fields = ['id', 'club', 'full_name', 'date_of_birth', 'card_number', 'phone_number', 'phone_number_2', 'address', 'notes', 'hire_date', 'rfid_code', 'default_hourly_rate', 'default_expected_hours', 'job_title', 'gender', 'groups']

class EmployeeSalarySerializer(serializers.ModelSerializer):
    employee_details = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeSalary
        fields = ['id', 'employee', 'employee_details', 'month', 'worked_hours', 'amount', 'is_locked', 'created_at']

    def get_employee_details(self, obj):
        return {'id': obj.employee.id, 'full_name': obj.employee.full_name}

class EmployeeTransactionSerializer(serializers.ModelSerializer):
    employee_details = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeTransaction
        fields = ['id', 'employee', 'employee_details', 'amount', 'transaction_type', 'description', 'date', 'invoice_number']

    def get_employee_details(self, obj):
        return {'id': obj.employee.id, 'full_name': obj.employee.full_name}

class EmployeeFinancialRecordSerializer(serializers.ModelSerializer):
    employee_details = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeFinancialRecord
        fields = ['id', 'employee', 'employee_details', 'month', 'balance', 'created_at']

    def get_employee_details(self, obj):
        return {'id': obj.employee.id, 'full_name': obj.employee.full_name}

class SupplierInvoiceSerializer(serializers.ModelSerializer):
    supplier_details = serializers.SerializerMethodField()

    class Meta:
        model = SupplierInvoice
        fields = ['id', 'supplier', 'supplier_details', 'club', 'amount', 'description', 'date', 'invoice_number', 'is_paid', 'created_by']

    def get_supplier_details(self, obj):
        return {'id': obj.supplier.id, 'name': obj.supplier.name}