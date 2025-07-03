
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from django.db.models import F
from decimal import Decimal
from subscriptions.models import Subscription 

def update_negative_remaining_amount():

    negative_subscriptions = Subscription.objects.filter(remaining_amount__lt=0)
    

    affected_count = negative_subscriptions.count()
    

    negative_subscriptions.update(remaining_amount=Decimal('0.00'))
    
    return affected_count

if __name__ == "__main__":
    try:
        count = update_negative_remaining_amount()
#         print(f"done {count}  remaining_amount to zero")
    except Exception as e:
#         print(f"zerror : {str(e)}")
