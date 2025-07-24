import sqlite3
import logging
from contextlib import contextmanager
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from django.apps import apps
import pytz
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    filename='attendance_migration.log',
    format='%(asctime)s - %(levelname)s - %(message)s'
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

def get_table_data(db_path, table_name):
    """Retrieve all data from a specified table in the database."""
    try:
        with get_db_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM \"{table_name}\"")
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            cursor.execute(f"SELECT COUNT(*) FROM \"{table_name}\"")
            total_records = cursor.fetchone()[0]
        logger.info(f"Fetched {len(rows)} rows from {table_name} with columns: {columns}. Total records: {total_records}")
        return columns, rows, total_records
    except sqlite3.OperationalError as e:
        logger.error(f"Error accessing table {table_name}: {e}")
        return [], [], 0

def check_foreign_key(table, column, value, new_db_path):
    """Check if a foreign key value exists in the new database."""
    try:
        if value is None:
            return True
        with get_db_connection(new_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT COUNT(*) FROM \"{table}\" WHERE \"{column}\" = ?", (value,))
            count = cursor.fetchone()[0]
        if count == 0:
            logger.warning(f"Foreign key check failed: {table}.{column} = {value} not found")
        return count > 0
    except sqlite3.OperationalError as e:
        logger.error(f"Error checking foreign key {table}.{column}: {e}")
        return False

def migrate_attendance_table(old_db_path, new_db_path):
    """Migrate data for the attendance_attendance table."""
    migration_summary = {'attendance_attendance': {'total': 0, 'success': 0, 'failed': 0}}
    errors = []

    # Get the Attendance model
    model = None
    for m in apps.get_models():
        if m._meta.db_table == 'attendance_attendance':
            model = m
            break
    if not model:
        logger.error("Attendance model not found")
        return migration_summary, errors

    # Clear existing data in the attendance_attendance table
    try:
        model.objects.all().delete()
        logger.info("Cleared existing data in attendance_attendance table")
    except Exception as e:
        logger.error(f"Error clearing attendance_attendance table: {e}")
        return migration_summary, errors

    old_columns, rows, total_records = get_table_data(old_db_path, 'attendance_attendance')
    if not rows:
        logger.info("Table attendance_attendance is empty")
        migration_summary['attendance_attendance'] = {'total': 0, 'success': 0, 'failed': 0}
        return migration_summary, errors

    logger.info(f"Migrating table attendance_attendance ({total_records} records)...")
    migration_summary['attendance_attendance'] = {'total': total_records, 'success': 0, 'failed': 0}

    new_fields = {field.name: field for field in model._meta.fields}
    new_field_names = set(new_fields.keys())
    old_field_names = set(old_columns)
    missing_fields = new_field_names - old_field_names
    logger.info(f"Missing fields in attendance_attendance: {missing_fields}")

    batch = []
    attendance_defaults = {
        'attendance.Attendance.approved_by': None,
    }

    for row_index, row in enumerate(rows):
        row_data = dict(zip(old_columns, row))
        row_data['row_index'] = row_index

        # Validate foreign keys
        subscription_id = row_data.get('subscription_id')
        if subscription_id and not check_foreign_key('subscriptions_subscription', 'id', subscription_id, new_db_path):
            errors.append(f"Skipping record in attendance_attendance (row {row_index}): invalid subscription_id: {subscription_id}, data: {row_data}")
            migration_summary['attendance_attendance']['failed'] += 1
            continue

        approved_by_id = row_data.get('approved_by_id')
        if approved_by_id and not check_foreign_key('accounts_user', 'id', approved_by_id, new_db_path):
            errors.append(f"Skipping record in attendance_attendance (row {row_index}): invalid approved_by_id: {approved_by_id}, data: {row_data}")
            migration_summary['attendance_attendance']['failed'] += 1
            continue

        # Combine attendance_date and entry_time into timestamp
        attendance_date = row_data.get('attendance_date')
        entry_time = row_data.get('entry_time')
        if attendance_date and entry_time:
            try:
                # Handle entry_time with or without microseconds
                try:
                    # Try parsing with microseconds
                    parsed_time = datetime.strptime(str(entry_time), '%H:%M:%S.%f').time()
                except ValueError:
                    # Fallback to parsing without microseconds
                    parsed_time = datetime.strptime(str(entry_time), '%H:%M:%S').time()

                combined_datetime = datetime.combine(
                    datetime.strptime(str(attendance_date), '%Y-%m-%d').date(),
                    parsed_time
                )
                row_data['timestamp'] = timezone.make_aware(combined_datetime, pytz.timezone('Africa/Cairo'))
                row_data.pop('attendance_date', None)
                row_data.pop('entry_time', None)
            except ValueError as e:
                errors.append(f"Error parsing date/time for attendance_attendance (row {row_index}): attendance_date={attendance_date}, entry_time={entry_time}, error: {e}")
                migration_summary['attendance_attendance']['failed'] += 1
                continue
        else:
            errors.append(f"Skipping record in attendance_attendance (row {row_index}): missing attendance_date or entry_time: {row_data}")
            migration_summary['attendance_attendance']['failed'] += 1
            continue

        # Handle missing fields
        for field in missing_fields:
            default_key = f"attendance.Attendance.{field}"
            if default_key in attendance_defaults:
                row_data[field] = attendance_defaults[default_key]
            elif new_fields[field].has_default():
                row_data[field] = new_fields[field].get_default()
            else:
                row_data[field] = None

        row_data.pop('row_index', None)

        try:
            obj = model(**row_data)
            batch.append(obj)
        except Exception as e:
            errors.append(f"Error creating object for attendance_attendance (row {row_index}): {e}, data: {row_data}")
            migration_summary['attendance_attendance']['failed'] += 1
            continue

        if len(batch) >= 500:
            try:
                model.objects.bulk_create(batch, ignore_conflicts=True)
                migration_summary['attendance_attendance']['success'] += len(batch)
                batch = []
            except Exception as e:
                errors.append(f"Error saving batch for attendance_attendance: {e}, data: {[str(dict(obj.__dict__)) for obj in batch[:5]]}")
                migration_summary['attendance_attendance']['failed'] += len(batch)
                logger.info("Attempting to save records individually for attendance_attendance...")
                batch_errors = []
                for obj in batch:
                    try:
                        # Check if record exists
                        existing = model.objects.filter(id=obj.id).exists()
                        if not existing:
                            obj.save()
                            migration_summary['attendance_attendance']['success'] += 1
                        else:
                            batch_errors.append(f"Record with id {obj.id} already exists, skipping: {dict(obj.__dict__)}")
                            migration_summary['attendance_attendance']['failed'] += 1
                    except Exception as e:
                        batch_errors.append(f"Error saving individual record for attendance_attendance: {e}, data: {dict(obj.__dict__)}")
                        migration_summary['attendance_attendance']['failed'] += 1
                if batch_errors:
                    errors.extend(batch_errors[:10])
                batch = []

    if batch:
        try:
            model.objects.bulk_create(batch, ignore_conflicts=True)
            migration_summary['attendance_attendance']['success'] += len(batch)
        except Exception as e:
            errors.append(f"Error saving final batch for attendance_attendance: {e}, data: {[str(dict(obj.__dict__)) for obj in batch[:5]]}")
            migration_summary['attendance_attendance']['failed'] += len(batch)
            logger.info("Attempting to save final records individually for attendance_attendance...")
            batch_errors = []
            for obj in batch:
                try:
                    existing = model.objects.filter(id=obj.id).exists()
                    if not existing:
                        obj.save()
                        migration_summary['attendance_attendance']['success'] += 1
                    else:
                        batch_errors.append(f"Final record with id {obj.id} already exists, skipping: {dict(obj.__dict__)}")
                        migration_summary['attendance_attendance']['failed'] += 1
                except Exception as e:
                    batch_errors.append(f"Error saving final individual record for attendance_attendance: {e}, data: {dict(obj.__dict__)}")
                    migration_summary['attendance_attendance']['failed'] += 1
            if batch_errors:
                errors.extend(batch_errors[:10])

    if errors:
        logger.info(f"Completed migration of attendance_attendance with {len(errors)} errors")
        for error in errors[:10]:
            logger.error(error)
    else:
        logger.info("Completed migration of attendance_attendance successfully")

    return migration_summary, errors

def print_summary(migration_summary):
    """Print migration summary."""
    logger.info("\n=== Migration Summary ===")
    logger.info(f"{'Table':<30} {'Total':>10} {'Success':>10} {'Failed':>10}")
    logger.info("-" * 62)
    for table, stats in migration_summary.items():
        logger.info(f"{table:<30} {stats['total']:>10} {stats['success']:>10} {stats['failed']:>10}")
    logger.info("========================")

def print_detailed_errors(migration_summary, errors):
    """Print detailed error report for failed migrations."""
    logger.info("\n=== Detailed Error Report ===")
    for table, stats in migration_summary.items():
        if stats['failed'] > 0:
            logger.info(f"\nTable: {table}")
            table_errors = [e for e in errors if table in e]
            for error in table_errors[:5]:
                logger.error(error)
    logger.info("============================")

if __name__ == "__main__":
    OLD_DB_PATH = r"F:\club\gym\src\db_old.sqlite3"
    NEW_DB_PATH = r"F:\club\gym\src\db.sqlite3"
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
    import django
    django.setup()
    migration_summary, errors = migrate_attendance_table(OLD_DB_PATH, NEW_DB_PATH)
    print_summary(migration_summary)
    print_detailed_errors(migration_summary, errors)
