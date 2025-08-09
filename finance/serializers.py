from rest_framework import serializers
from django.utils import timezone
from .models import Expense, Income, ExpenseCategory, IncomeSource, StockItem, StockTransaction, Schedule, CashJournal
from core.serializers import ClubSerializer
from accounts.serializers import UserSerializer

class ExpenseCategorySerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)

    class Meta:
        model = ExpenseCategory
        fields = ['id', 'club', 'club_details', 'name', 'description', 'is_stock_related']

class ExpenseSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    category_details = ExpenseCategorySerializer(source='category', read_only=True)
    paid_by_details = UserSerializer(source='paid_by', read_only=True)
    related_employee_details = UserSerializer(source='related_employee', read_only=True)
    stock_item_details = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    date = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', input_formats=['%Y-%m-%d %H:%M:%S', '%Y-%m-%d'])
    cash_journal = serializers.PrimaryKeyRelatedField(read_only=True)  # New field, read-only

    class Meta:
        model = Expense
        fields = [
            'id', 'club', 'club_details', 'category', 'category_details',
            'amount', 'description', 'date', 'paid_by', 'paid_by_details',
            'related_employee', 'related_employee_details',
            'invoice_number', 'attachment', 'attachment_url', 'stock_item',
            'stock_item_details', 'stock_quantity', 'cash_journal'  # Added
        ]
        extra_kwargs = {
            'attachment': {'required': False},
            'stock_item': {'required': False},
            'stock_quantity': {'required': False},
            'related_employee': {'required': False}
        }

    def get_attachment_url(self, obj):
        if obj.attachment:
            return self.context['request'].build_absolute_uri(obj.attachment.url)
        return None

    def get_stock_item_details(self, obj):
        if obj.stock_item:
            return {
                'id': obj.stock_item.id,
                'name': obj.stock_item.name,
                'unit': obj.stock_item.unit
            }
        return None

    def validate_date(self, value):
        if self.instance is None:  # مصروف جديد
            return timezone.now()
        if timezone.is_naive(value):
            value = timezone.make_aware(value, timezone.get_current_timezone())
        if value > timezone.now():
            raise serializers.ValidationError('لا يمكن تسجيل مصروف في المستقبل.')
        return value

class IncomeSourceSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    stock_item_details = serializers.SerializerMethodField()

    class Meta:
        model = IncomeSource
        fields = ['id', 'club', 'club_details', 'name', 'description', 'price', 'stock_item', 'stock_item_details']

    def get_stock_item_details(self, obj):
        if obj.stock_item:
            return {
                'id': obj.stock_item.id,
                'name': obj.stock_item.name,
                'unit': obj.stock_item.unit,
                'is_sellable': obj.stock_item.is_sellable
            }
        return None

class IncomeSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    source_details = IncomeSourceSerializer(source='source', read_only=True)
    received_by_details = UserSerializer(source='received_by', read_only=True)
    stock_transaction_details = serializers.SerializerMethodField()
    date = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    cash_journal = serializers.PrimaryKeyRelatedField(read_only=True)  # New field, read-only

    class Meta:
        model = Income
        fields = [
            'id', 'club', 'club_details', 'source', 'source_details',
            'amount', 'description', 'date', 'received_by', 'received_by_details',
            'stock_transaction', 'stock_transaction_details', 'quantity', 'cash_journal'  # Added
        ]

    def get_stock_transaction_details(self, obj):
        if obj.stock_transaction:
            return {
                'id': obj.stock_transaction.id,
                'transaction_type': obj.stock_transaction.transaction_type,
                'quantity': obj.stock_transaction.quantity,
                'date': obj.stock_transaction.date.isoformat(),
                'stock_item_details': {
                    'id': obj.stock_transaction.stock_item.id,
                    'name': obj.stock_transaction.stock_item.name,
                    'unit': obj.stock_transaction.stock_item.unit
                }
            }
        return None

    def validate_date(self, value):
        if value > timezone.now():
            raise serializers.ValidationError('لا يمكن تسجيل إيراد في المستقبل.')
        return value

class StockItemSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)

    class Meta:
        model = StockItem
        fields = ['id', 'club', 'club_details', 'name', 'description', 'unit', 'initial_quantity', 'current_quantity', 'is_sellable']

class StockTransactionSerializer(serializers.ModelSerializer):
    stock_item_details = serializers.SerializerMethodField()
    date = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S')
    cash_journal = serializers.PrimaryKeyRelatedField(read_only=True)  # New field

    class Meta:
        model = StockTransaction
        fields = [
            'id', 'stock_item', 'stock_item_details', 'transaction_type',
            'quantity', 'date', 'description', 'related_expense', 'related_income', 'cash_journal'  # Added
        ]

    def get_stock_item_details(self, obj):
        return {
            'id': obj.stock_item.id,
            'name': obj.stock_item.name,
            'unit': obj.stock_item.unit
        }

class IncomeSummarySerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S')
    source_name = serializers.CharField(source='source.name', read_only=True)
    received_by_name = serializers.CharField(source='received_by.username', read_only=True)

    class Meta:
        model = Income
        fields = ['id', 'amount', 'date', 'source', 'source_name', 'received_by', 'received_by_name']

class ExpenseDetailSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S')
    category_name = serializers.CharField(source='category.name', read_only=True)
    related_employee_username = serializers.CharField(source='related_employee.username', read_only=True, allow_null=True)

    class Meta:
        model = Expense
        fields = ['id', 'amount', 'date', 'category_name', 'related_employee_username']
        
class IncomeDetailSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S')
    source_name = serializers.CharField(source='source.name', read_only=True)

    class Meta:
        model = Income
        fields = ['id', 'amount', 'date', 'source_name']

class ScheduleSerializer(serializers.ModelSerializer):
    start = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', input_formats=['%Y-%m-%d %H:%M:%S', 'iso8601'])
    end = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', input_formats=['%Y-%m-%d %H:%M:%S', 'iso8601'])

    class Meta:
        model = Schedule
        fields = ['id', 'club', 'title', 'start', 'end', 'type', 'created_by']
        read_only_fields = ['id', 'created_by']

    def validate(self, data):
        if data['start'] >= data['end']:
            raise serializers.ValidationError({
                'start': 'وقت البدء يجب أن يكون قبل وقت الانتهاء.'
            })

        user = self.context['request'].user
        if data['club'].id != user.club.id:
            raise serializers.ValidationError({
                'club': 'لا يمكن إنشاء جدول لنادي غير مرتبط بالمستخدم.'
            })

        data['created_by'] = user
        return data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return representation

from django.db import models


class CashJournalSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    club_details = ClubSerializer(source='club', read_only=True)
    total_income = serializers.SerializerMethodField()
    total_expense = serializers.SerializerMethodField()
    net_profit = serializers.SerializerMethodField()

    class Meta:
        model = CashJournal
        fields = ['id', 'user', 'user_details', 'club', 'club_details', 'attendance', 'start_time', 'end_time', 'status', 
                  'initial_balance', 'final_balance', 'notes', 'total_income', 'total_expense', 'net_profit']
        read_only_fields = ['id', 'start_time', 'end_time', 'status', 'final_balance']

    def get_total_income(self, obj):
        return obj.incomes.aggregate(models.Sum('amount'))['amount__sum'] or 0

    def get_total_expense(self, obj):
        return obj.expenses.aggregate(models.Sum('amount'))['amount__sum'] or 0

    def get_net_profit(self, obj):
        return self.get_total_income(obj) - self.get_total_expense(obj)

    def update(self, instance, validated_data):
        if 'status' in validated_data and validated_data['status'] == 'closed' and instance.status == 'open':
            instance.close_journal()
        else:
            instance = super().update(instance, validated_data)
        return instance