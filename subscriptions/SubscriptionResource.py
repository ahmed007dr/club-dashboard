from members.models import Member
from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget
from .models import SubscriptionType, Subscription
from core.models import Club

class SubscriptionResource(resources.ModelResource):
    club__name = fields.Field(
        column_name='club__name',
        attribute='club',
        widget=ForeignKeyWidget(Club, 'name')
    )

    member__name = fields.Field(
        column_name='member__name',
        attribute='member',
        widget=ForeignKeyWidget(Member, 'id')
        # widget=ForeignKeyWidget(Member, 'name')
    )

    type__name = fields.Field(
        column_name='type__name',
        attribute='type',
        widget=ForeignKeyWidget(SubscriptionType, 'name')
    )

    class Meta:
        model = Subscription
        import_id_fields = ['member__name', 'type__name', 'start_date']
        fields = (
            'id', 'club__name', 'member__name', 'type__name',
            'start_date', 'end_date', 'paid_amount',
            'remaining_amount', 'entry_count'
        )
