from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from django.utils import timezone
from .models import Employee, EmployeeSalary, EmployeeTransaction, EmployeeFinancialRecord, Supplier, SupplierInvoice
from .serializers import EmployeeSerializer, EmployeeSalarySerializer, EmployeeTransactionSerializer, EmployeeFinancialRecordSerializer, SupplierInvoiceSerializer
from staff.models import StaffAttendance
from accounts.permissions import IsAllowedRole
from django.contrib.auth.models import Group

@api_view(['GET'])
@permission_classes([IsAllowedRole])
def employee_salary_api(request, employee_id):
    try:
        employee = Employee.objects.get(id=employee_id, club=request.user.club)
        current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        salary, created = EmployeeSalary.objects.get_or_create(
            employee=employee, club=request.user.club, month=current_month, defaults={'created_by': request.user}
        )
        attendances = StaffAttendance.objects.filter(staff=employee, check_in__month=current_month.month, check_in__year=current_month.year, check_out__isnull=False)
        worked_hours = sum((a.check_out - a.check_in).total_seconds() / 3600 for a in attendances)
        salary.worked_hours = worked_hours
        salary.amount = employee.default_hourly_rate * worked_hours
        salary.save()
        transactions = EmployeeTransaction.objects.filter(employee=employee, date__month=current_month.month, date__year=current_month.year)
        total_transactions = transactions.aggregate(total=Sum('amount'))['total'] or 0
        financial_record = EmployeeFinancialRecord.objects.filter(employee=employee, month=current_month).first()
        net_salary = salary.amount - total_transactions
        return Response({
            'employee_id': employee.id,
            'employee_name': employee.full_name,
            'hourly_rate': float(employee.default_hourly_rate),
            'worked_hours': float(salary.worked_hours),
            'salary': float(salary.amount),
            'net_salary': float(net_salary),
            'transactions': EmployeeTransactionSerializer(transactions, many=True).data,
            'is_locked': salary.is_locked,
            'job_title': employee.job_title,
            'gender': employee.gender,
            'groups': [group.name for group in employee.groups.all()],
            'balance': float(financial_record.balance) if financial_record else 0.0
        }, status=status.HTTP_200_OK)
    except Employee.DoesNotExist:
        return Response({'error': 'الموظف غير موجود'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAllowedRole])
def update_employee_details_api(request, employee_id):
    try:
        employee = Employee.objects.get(id=employee_id, club=request.user.club)
        serializer = EmployeeSerializer(employee, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Employee.DoesNotExist:
        return Response({'error': 'الموظف غير موجود'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAllowedRole])
def lock_salary_api(request, employee_id):
    try:
        employee = Employee.objects.get(id=employee_id, club=request.user.club)
        current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        salary = EmployeeSalary.objects.filter(employee=employee, month=current_month).order_by('-created_at').first()
        if salary and not salary.is_locked and current_month.month != timezone.now().month:
            salary.is_locked = True
            salary.save()
            return Response({'message': 'تم تثبيت المرتب بنجاح'}, status=status.HTTP_200_OK)
        return Response({'error': 'لا يمكن تثبيت المرتب الآن'}, status=status.HTTP_400_BAD_REQUEST)
    except Employee.DoesNotExist:
        return Response({'error': 'الموظف غير موجود'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAllowedRole])
def add_employee_transaction_api(request):
    data = request.data.copy()
    data['club'] = request.user.club.id
    data['created_by'] = request.user.id
    serializer = EmployeeTransactionSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAllowedRole])
def supplier_invoices_api(request, supplier_id):
    try:
        supplier = Supplier.objects.get(id=supplier_id, club=request.user.club)
        invoices = SupplierInvoice.objects.filter(supplier=supplier)
        serializer = SupplierInvoiceSerializer(invoices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Supplier.DoesNotExist:
        return Response({'error': 'المورد غير موجود'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAllowedRole])
def add_supplier_invoice_api(request):
    data = request.data.copy()
    data['club'] = request.user.club.id
    data['created_by'] = request.user.id
    try:
        supplier = Supplier.objects.get(id=data.get('supplier'), club=request.user.club)
        data['supplier'] = supplier.id
    except Supplier.DoesNotExist:
        return Response({'error': 'المورد غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    serializer = SupplierInvoiceSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)