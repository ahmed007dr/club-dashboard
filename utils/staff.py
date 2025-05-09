# staff/utils.py

from datetime import datetime, timedelta
from django.utils import timezone
from staff.models import Shift

def find_current_shift(user):
    now = timezone.now()

    shifts = Shift.objects.filter(staff=user).select_related('club')

    for shift in shifts:
        shift_start = datetime.combine(shift.date, shift.shift_start)
        shift_end_date = shift.shift_end_date or shift.date
        shift_end = datetime.combine(shift_end_date, shift.shift_end)

        if shift_end < shift_start:
            shift_end += timedelta(days=1)

        shift_start = timezone.make_aware(shift_start)
        shift_end = timezone.make_aware(shift_end)

        if shift_start <= now <= shift_end:
            return shift

    return None
