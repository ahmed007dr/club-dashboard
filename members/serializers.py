from rest_framework import serializers
from .models import Member

class MemberSerializer(serializers.ModelSerializer):
    referred_by_name = serializers.CharField(source='referred_by.name', read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)

    class Meta:
        model = Member
        fields = [
            'id',
            'club',
            'club_name',
            'name',
            'membership_number',
            'rfid_code',
            'national_id',
            'birth_date',
            'phone',
            'phone2',
            'photo',
            'job',
            'address',
            'note',
            'created_at',
            'referred_by',
            'referred_by_name'
        ]
        extra_kwargs = {
            'photo': {'required': False, 'allow_null': True},
            'referred_by': {'required': False, 'allow_null': True},
            'rfid_code': {'required': False, 'allow_null': True},
            'phone2': {'required': False, 'allow_null': True},
            'job': {'required': False, 'allow_null': True},
            'address': {'required': False, 'allow_null': True},
            'note': {'required': False, 'allow_null': True},
            'national_id': {'required': False, 'allow_null': True},
        }

    def to_internal_value(self, data):
        print("تم تنفيذ خطوة: بدء تحويل البيانات المدخلة في MemberSerializer")
        print(f"تم تنفيذ خطوة: البيانات المرسلة = {data}")
        try:
            validated_data = super().to_internal_value(data)
            print("تم تنفيذ خطوة: نجاح تحويل البيانات المدخلة إلى قيم داخلية")
            return validated_data
        except serializers.ValidationError as e:
            print("تم تنفيذ خطوة: فشل تحويل البيانات المدخلة، الأخطاء:", e.detail)
            raise

    def to_representation(self, instance):
        print(f"تم تنفيذ خطوة: بدء تحويل بيانات العضو إلى JSON، العضو ID = {instance.id}")
        representation = super().to_representation(instance)
        print(f"تم تنفيذ خطوة: نجاح تحويل بيانات العضو إلى JSON، البيانات = {representation}")
        return representation