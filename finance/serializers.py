from rest_framework import serializers
from .models import Expense, Income, ExpenseCategory, IncomeSource, StockItem, StockTransaction
from core.serializers import ClubSerializer
from accounts.serializers import UserSerializer
from receipts.serializers import ReceiptSerializer

class ExpenseCategorySerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)

    class Meta:
        model = ExpenseCategory
        fields = ['id', 'club', 'club_details', 'name', 'description', 'is_stock_related']

class ExpenseSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    category_details = ExpenseCategorySerializer(source='category', read_only=True)
    paid_by_details = UserSerializer(source='paid_by', read_only=True)
    related_employee_details = UserSerializer(source='related_employee', read_only=True)  # حقل جديد
    stock_item_details = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            'id', 'club', 'club_details', 'category', 'category_details',
            'amount', 'description', 'date', 'paid_by', 'paid_by_details',
            'related_employee', 'related_employee_details',  # إضافة الحقول الجديدة
            'invoice_number', 'attachment', 'attachment_url', 'stock_item',
            'stock_item_details', 'stock_quantity'
        ]
        extra_kwargs = {
            'attachment': {'required': False},
            'stock_item': {'required': False},
            'stock_quantity': {'required': False},
            'related_employee': {'required': False}  # اختياري
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
    receipt_details = ReceiptSerializer(source='related_receipt', read_only=True)
    stock_transaction_details = serializers.SerializerMethodField()

    class Meta:
        model = Income
        fields = [
            'id', 'club', 'club_details', 'source', 'source_details',
            'amount', 'description', 'date', 'received_by', 'received_by_details',
            'related_receipt', 'receipt_details', 'stock_transaction', 'stock_transaction_details',
            'quantity'  # إضافة حقل quantity
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
    

    
class StockItemSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)

    class Meta:
        model = StockItem
        fields = ['id', 'club', 'club_details', 'name', 'description', 'unit', 'initial_quantity', 'current_quantity', 'is_sellable']
        
class StockTransactionSerializer(serializers.ModelSerializer):
    stock_item_details = serializers.SerializerMethodField()

    class Meta:
        model = StockTransaction
        fields = [
            'id', 'stock_item', 'stock_item_details', 'transaction_type',
            'quantity', 'date', 'description', 'related_expense', 'related_income'
        ]

    def get_stock_item_details(self, obj):
        return {
            'id': obj.stock_item.id,
            'name': obj.stock_item.name,
            'unit': obj.stock_item.unit
        }

class IncomeSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = ['id', 'amount', 'date', 'source', 'received_by']

class ExpenseDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'amount', 'date', 'category_name']

class IncomeDetailSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source='source.name', read_only=True)

    class Meta:
        model = Income
        fields = ['id', 'amount', 'date', 'source_name']