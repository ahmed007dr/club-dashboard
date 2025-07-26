import sqlite3
from datetime import datetime
import pytz
from dateutil.parser import parse
import logging
from django.utils import timezone
from contextlib import contextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    filename='fix_attendance_timestamps.log',
    format='%(asctime)s - %(levelname)s - %(message)s',
    encoding='utf-8'
)
logger = logging.getLogger(__name__)

@contextmanager
def get_db_connection(db_path):
    """Context manager for SQLite database connections."""
    conn = sqlite3.connect(db_path)
    try:
        yield conn
    finally:
        conn.close()

def fetch_old_attendance_data(old_db_path):
    """Fetch attendance_date and entry_time from old database."""
    logger.info("Fetching attendance data from old database...")
    try:
        with get_db_connection(old_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, attendance_date, entry_time FROM attendance_attendance")
            rows = cursor.fetchall()
            logger.info(f"Fetched {len(rows)} records from old attendance_attendance table")
            return {row[0]: {'attendance_date': row[1], 'entry_time': row[2]} for row in rows}
    except sqlite3.OperationalError as e:
        logger.error(f"Error fetching data from old database: {e}")
        return {}

def update_new_attendance_data(new_db_path, old_data):
    """Update timestamp in new database using old attendance_date and entry_time."""
    logger.info("Updating timestamps in new database...")
    updated_count = 0
    failed_count = 0

    with get_db_connection(new_db_path) as conn:
        cursor = conn.cursor()
        for record_id, data in old_data.items():
            attendance_date = data['attendance_date']
            entry_time = data['entry_time']
            timestamp = None

            if attendance_date and entry_time:
                try:
                    if isinstance(attendance_date, str):
                        attendance_date = parse(attendance_date).date()
                    if isinstance(entry_time, str):
                        entry_time = parse(entry_time).time()
                    combined_datetime = datetime.combine(attendance_date, entry_time)
                    timestamp = timezone.make_aware(combined_datetime, pytz.timezone('Africa/Cairo'))
                except Exception as e:
                    logger.error(f"Failed to parse datetime for record ID {record_id}: {e}")
                    failed_count += 1
                    continue
            else:
                logger.warning(f"Missing attendance_date or entry_time for record ID {record_id}")
                failed_count += 1
                continue

            try:
                cursor.execute(
                    "UPDATE attendance_attendance SET timestamp = ? WHERE id = ?",
                    (timestamp, record_id)
                )
                updated_count += 1
            except sqlite3.OperationalError as e:
                logger.error(f"Error updating record ID {record_id}: {e}")
                failed_count += 1

        conn.commit()
        logger.info(f"Updated {updated_count} records successfully, {failed_count} records failed")

if __name__ == "__main__":
    OLD_DB_PATH = r"F:\club\gym\src\db_old.sqlite3"
    NEW_DB_PATH = r"F:\club\gym\src\db.sqlite3"
    
    # Ensure UTF-8 encoding
    import os
    os.environ['PYTHONIOENCODING'] = 'utf-8'

    old_data = fetch_old_attendance_data(OLD_DB_PATH)
    update_new_attendance_data(NEW_DB_PATH, old_data)