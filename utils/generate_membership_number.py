from django.db.models import Max
from datetime import datetime

def generate_membership_number(created_at=None):

    if created_at is None:
        created_at = datetime.now()

    year = str(created_at.year)[-2:]  
    month = str(created_at.month).zfill(2)  
    day = str(created_at.day).zfill(2)  

    from members.models import Member 
    prefix = f"{year}{month}{day}"
    last_member = Member.objects.filter(membership_number__startswith=prefix).aggregate(Max('membership_number'))
    
    if last_member['membership_number__max']:
        last_sequence = int(last_member['membership_number__max'][-3:])
        if last_sequence >= 999:
            raise ValueError("Cannot generate membership number: Maximum limit of 999 members per day reached.")
        sequence = str(last_sequence + 1).zfill(3)
    else:
        sequence = "001"  

    return f"{prefix}{sequence}"