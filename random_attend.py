import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()
from datetime import datetime, timedelta, time
import random

# Setup Django environment

from attendance.models import Attendance
from django.db.models import Count
from django.utils import timezone

def distribute_attendance_records():
    # Define the year, target date, and distribution period
    target_date = datetime(2025, 5, 24).date()
    year = 2025
    max_entries_per_day = 111
    start_date = datetime(2025, 1, 1).date()
    end_date = target_date  # Distribute up to 24 May 2025

    # Get all records for 24 May 2025
    records = Attendance.objects.filter(attendance_date=target_date)
    total_records = records.count()
    print(f"Found {total_records} records for {target_date}")

    if total_records == 0:
        print("No records to distribute.")
        return

    # Get current entry counts for each day in the period (1 Jan to 24 May 2025)
    daily_counts = Attendance.objects.filter(
        attendance_date__year=year,
        attendance_date__gte=start_date,
        attendance_date__lte=end_date
    ).values('attendance_date').annotate(
        count=Count('id')
    ).order_by('attendance_date')

    # Create a dictionary of {date: current_count}
    daily_count_map = {entry['attendance_date']: entry['count'] for entry in daily_counts}

    # Define all dates in the period (1 Jan to 24 May 2025)
    all_dates = [start_date + timedelta(days=x) for x in range((end_date - start_date).days + 1)]

    # Calculate available slots per day
    available_slots = {}
    for date in all_dates:
        current_count = daily_count_map.get(date, 0)
        available_slots[date] = max_entries_per_day - current_count

    # Filter out days with no available slots
    valid_dates = [date for date, slots in available_slots.items() if slots > 0]
    if not valid_dates:
        print("No available slots in the period to distribute records.")
        return

    # Distribute records
    records_to_update = list(records)
    random.shuffle(records_to_update)  # Shuffle to avoid bias
    records_updated = 0

    for record in records_to_update:
        if not valid_dates:
            print(f"Stopped: No more available slots. {total_records - records_updated} records not distributed.")
            break

        # Choose a random date with available slots
        chosen_date = random.choice(valid_dates)
        record.attendance_date = chosen_date

        # Optionally set entry_time (if needed by your app)
        if record.entry_time is None:
            # Generate a random time between 8 AM and 10 PM
            random_hour = random.randint(8, 22)
            random_minute = random.randint(0, 59)
            record.entry_time = time(random_hour, random_minute)

        # Update the record
        record.save()
        records_updated += 1

        # Update available slots
        available_slots[chosen_date] -= 1
        if available_slots[chosen_date] == 0:
            valid_dates.remove(chosen_date)

    print(f"Successfully distributed {records_updated} records from 1 Jan to 24 May 2025.")

if __name__ == "__main__":
    distribute_attendance_records()