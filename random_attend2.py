import os
import django
from datetime import datetime, timedelta, time
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from attendance.models import Attendance
from django.db.models import Count
from django.utils import timezone

def generate_entry_time():
    """Generate a random entry time between 9:00 AM and 4:00 AM the next day."""
    # Generate time between 9:00 AM (9:00) and 4:00 AM next day (28:00 in hours)
    total_minutes = random.randint(9 * 60, (24 + 4) * 60)  # 540 to 1680 minutes
    hours = total_minutes // 60
    minutes = total_minutes % 60
    is_next_day = hours >= 24
    if is_next_day:
        hours -= 24  # Convert to 0-4 AM for next day
    return time(hours, minutes), is_next_day

def distribute_attendance_records():
    # Define the year, target date, and distribution period
    target_date = datetime(2025, 5, 24).date()
    year = 2025
    min_entries_per_day = 50
    max_entries_per_day = 110
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
        if current_count < max_entries_per_day:
            available_slots[date] = max_entries_per_day - current_count

    # Filter out days that can't take at least min_entries_per_day
    valid_dates = [date for date, slots in available_slots.items() if slots > 0]
    if not valid_dates:
        print("No available slots in the period to distribute records.")
        return

    # Try to meet min_entries_per_day where possible
    records_to_update = list(records)
    random.shuffle(records_to_update)  # Shuffle to avoid bias
    records_updated = 0
    records_per_day = max(min_entries_per_day, total_records // len(valid_dates))  # Approximate distribution

    # First pass: Ensure min_entries_per_day where possible
    for date in valid_dates[:]:
        slots = available_slots[date]
        target_count = min(records_per_day, slots, len(records_to_update))
        if target_count == 0:
            valid_dates.remove(date)
            continue

        for _ in range(target_count):
            if not records_to_update:
                break
            record = records_to_update.pop(0)
            entry_time, is_next_day = generate_entry_time()
            record.entry_time = entry_time
            record.attendance_date = date - timedelta(days=1) if is_next_day else date
            record.save()
            records_updated += 1
            available_slots[date] -= 1

        if available_slots[date] == 0:
            valid_dates.remove(date)

    # Second pass: Distribute remaining records
    while records_to_update and valid_dates:
        date = random.choice(valid_dates)
        if available_slots[date] == 0:
            valid_dates.remove(date)
            continue

        record = records_to_update.pop(0)
        entry_time, is_next_day = generate_entry_time()
        record.entry_time = entry_time
        record.attendance_date = date - timedelta(days=1) if is_next_day else date
        record.save()
        records_updated += 1
        available_slots[date] -= 1

        if available_slots[date] == 0:
            valid_dates.remove(date)

    if records_to_update:
        print(f"Warning: {len(records_to_update)} records could not be distributed due to slot limits.")
    print(f"Successfully distributed {records_updated} records from 1 Jan to 24 May 2025.")

if __name__ == "__main__":
    distribute_attendance_records()