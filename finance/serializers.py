from rest_framework import serializers
from .models import Expense, Income, ExpenseCategory, IncomeSource
from core.serializers import ClubSerializer
from accounts.serializers import UserSerializer
from receipts.serializers import ReceiptSerializer

class ExpenseCategorySerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'club', 'club_details', 'name', 'description']

class ExpenseSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    category_details = ExpenseCategorySerializer(source='category', read_only=True)
    paid_by_details = UserSerializer(source='paid_by', read_only=True)
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            'id', 'club', 'club_details', 'category', 'category_details',
            'amount', 'description', 'date', 'paid_by', 'paid_by_details',
            'invoice_number', 'attachment', 'attachment_url'
        ]
        extra_kwargs = {
            'attachment': {'required': False}
        }

    def get_attachment_url(self, obj):
        if obj.attachment:
            return self.context['request'].build_absolute_uri(obj.attachment.url)
        return None

class IncomeSourceSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    
    class Meta:
        model = IncomeSource
        fields = '__all__'

class IncomeSerializer(serializers.ModelSerializer):
    club_details = ClubSerializer(source='club', read_only=True)
    source_details = IncomeSourceSerializer(source='source', read_only=True)
    received_by_details = UserSerializer(source='received_by', read_only=True)
    receipt_details = ReceiptSerializer(source='related_receipt', read_only=True)

    class Meta:
        model = Income
        fields = [
            'id', 'club', 'club_details', 'source', 'source_details',
            'amount', 'description', 'date', 'received_by', 'received_by_details',
            'related_receipt', 'receipt_details'
        ]
        
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