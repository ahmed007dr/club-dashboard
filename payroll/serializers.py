from rest_framework import serializers
from .models import PayrollPeriod, Payroll, PayrollDeduction, EmployeeContract
from accounts.models import User
from members.models import Member
from subscriptions.models import Subscription,PrivateSubscriptionPayment

class PayrollDeductionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollDeduction
        fields = ['id', 'amount', 'reason', 'created_at']

class PayrollSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.username', read_only=True)
    deductions = PayrollDeductionSerializer(many=True, read_only=True)
    period_start_date = serializers.DateField(source='period.start_date', read_only=True)
    period_end_date = serializers.DateField(source='period.end_date', read_only=True)
    is_employee = serializers.SerializerMethodField()

    def get_is_employee(self, obj):
        return EmployeeContract.objects.filter(
            employee=obj.employee, club=obj.club,
            start_date__lte=obj.period.start_date
        ).exists()

    class Meta:
        model = Payroll
        fields = [
            'id', 'employee_name', 'period_start_date', 'period_end_date',
            'expected_hours', 'actual_hours', 'absent_hours',
            'base_salary', 'absence_deduction', 'private_earnings',
            'bonuses', 'total_salary', 'deductions', 'is_employee'
        ]

class PayrollPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollPeriod
        fields = ['id', 'club', 'start_date', 'end_date', 'is_active']

class PayrollCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payroll
        fields = ['employee', 'club', 'period', 'expected_hours', 'bonuses']

class PayrollDeductionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollDeduction
        fields = ['payroll', 'amount', 'reason']

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ['id', 'name', 'membership_number', 'phone']

class CoachSubscriptionSerializer(serializers.ModelSerializer):
    member = MemberSerializer(read_only=True)
    private_earnings = serializers.SerializerMethodField()

    def get_private_earnings(self, obj):
        payments = obj.payment_logs.filter(
            created_at__gte=obj.start_date,
            created_at__lte=obj.end_date
        )
        return sum(payment.coach_share for payment in payments if payment.coach_share) or 0.0

    class Meta:
        model = Subscription
        fields = ['id', 'member', 'start_date', 'end_date', 'private_earnings']

class CoachReportSerializer(serializers.ModelSerializer):
    subscriptions = serializers.SerializerMethodField()
    total_private_earnings = serializers.SerializerMethodField()
    client_count = serializers.SerializerMethodField()
    previous_client_count = serializers.SerializerMethodField()

    def get_subscriptions(self, obj):
        period = self.context.get('period')
        subscriptions = Subscription.objects.filter(
            coach=obj,
            type__is_private=True,
            start_date__lte=period.end_date,
            end_date__gte=period.start_date
        )
        return CoachSubscriptionSerializer(subscriptions, many=True).data

    def get_total_private_earnings(self, obj):
        period = self.context.get('period')
        payments = PrivateSubscriptionPayment.objects.filter(
            subscription__coach=obj,
            subscription__club=period.club,
            created_at__gte=period.start_date,
            created_at__lte=period.end_date
        )
        return sum(payment.coach_share for payment in payments) or 0.0

    def get_client_count(self, obj):
        period = self.context.get('period')
        return Subscription.objects.filter(
            coach=obj,
            type__is_private=True,
            start_date__lte=period.end_date,
            end_date__gte=period.start_date
        ).count()

    def get_previous_client_count(self, obj):
        period = self.context.get('period')
        previous_period = PayrollPeriod.objects.filter(
            club=period.club,
            end_date__lt=period.start_date
        ).order_by('-end_date').first()
        if not previous_period:
            return 0
        return Subscription.objects.filter(
            coach=obj,
            type__is_private=True,
            start_date__lte=previous_period.end_date,
            end_date__gte=previous_period.start_date
        ).count()

    class Meta:
        model = User
        fields = ['id', 'username', 'subscriptions', 'total_private_earnings', 'client_count', 'previous_client_count']