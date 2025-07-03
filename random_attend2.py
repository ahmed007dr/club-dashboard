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
    total_minutes = random.randint(9 * 60, (24 + 4) * 60)  # 540 to 1680 minutes
    hours = total_minutes // 60
    minutes = total_minutes % 60
    is_next_day = hours >= 24
    if is_next_day:
        hours -= 24
    return time(hours, minutes), is_next_day

def distribute_attendance_records(threshold=150):    # Define the year and distribution period
    year = 2025
    max_entries_per_day = 110
    min_entries_per_day = 50
    threshold = threshold
    start_date = datetime(2025, 1, 1).date()
    end_date = datetime(2025, 1, 31).date()  # Limit distribution to January 2025

    # Find days with more than 300 attendance records in 2025
    high_attendance_days = Attendance.objects.filter(
        attendance_date__year=year
    ).values('attendance_date').annotate(
        count=Count('id')
    ).filter(count__gt=threshold).order_by('attendance_date')

    if not high_attendance_days:
#         print("No days found with more than 300 attendance records in 2025.")
        return

    # Process each day with high attendance
    for day_entry in high_attendance_days:
        target_date = day_entry['attendance_date']
        total_records = day_entry['count']
#         print(f"Found {total_records} records for {target_date}")

        # Get records for the target date
        records = Attendance.objects.filter(attendance_date=target_date)
        excess_records = total_records - max_entries_per_day  # Keep up to max_entries_per_day
        if excess_records <= 0:
            continue

        # Get current entry counts for each day in the period (1 Jan to 31 Jan 2025)
        daily_counts = Attendance.objects.filter(
            attendance_date__year=year,
            attendance_date__gte=start_date,
            attendance_date__lte=end_date
        ).values('attendance_date').annotate(
            count=Count('id')
        ).order_by('attendance_date')

        # Create a dictionary of {date: current_count}
        daily_count_map = {entry['attendance_date']: entry['count'] for entry in daily_counts}

        # Define all dates in the period (1 Jan to 31 Jan 2025)
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
#             print(f"No available slots in January 2025 to distribute records from {target_date}.")
            continue

        # Select excess records to redistribute
        records_to_update = list(records)[:excess_records]
        random.shuffle(records_to_update)  # Shuffle to avoid bias
        records_updated = 0
        records_per_day = max(min_entries_per_day, len(records_to_update) // len(valid_dates)) if valid_dates else 0

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
#             print(f"Warning: {len(records_to_update)} records from {target_date} could not be distributed due to slot limits.")
#         print(f"Successfully distributed {records_updated} records from {target_date} to January 2025.")

if __name__ == "__main__":
    distribute_attendance_records()