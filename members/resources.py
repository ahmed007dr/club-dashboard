from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget
from .models import Member
from core.models import  Club

class MemberResource(resources.ModelResource):
    club__name = fields.Field(
        column_name='club__name',
        attribute='club',
        widget=ForeignKeyWidget(Club, 'name')
    )

    class Meta:
        model = Member
        import_id_fields = ['id']
        fields = ('id', 'name', 'membership_number', 'rfid_code', 'national_id', 'phone',
                  'phone2', 'birth_date', 'job', 'address', 'note', 'club__name', 'created_at')
