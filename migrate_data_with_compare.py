import sqlite3
import os
from django.conf import settings
from django.apps import apps
from django.core.management import call_command
from django.db import models
from django.utils import timezone
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_table_info(db_path, table_name):
    """Get the record count and columns of a table."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info(\"{table_name}\")")
        columns = [row[1] for row in cursor.fetchall()]
        cursor.execute(f"SELECT COUNT(*) FROM \"{table_name}\"")
        row_count = cursor.fetchone()[0]
        conn.close()
        return columns, row_count
    except sqlite3.OperationalError as e:
        logger.error(f"Error accessing table {table_name}: {e}")
        return [], 0

def get_table_data(db_path, table_name):
    """Get all data from a table."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM \"{table_name}\"")
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        conn.close()
        return columns, rows
    except sqlite3.OperationalError as e:
        logger.error(f"Error retrieving data from {table_name}: {e}")
        return [], []

def check_foreign_keys(table, row_data, new_db_path):
    """Check if foreign keys exist in the new database."""
    try:
        conn = sqlite3.connect(new_db_path)
        cursor = conn.cursor()
        foreign_key_checks = {
            'auth_group_permissions': [
                ('group_id', 'auth_group', 'id', 'Invalid group_id'),
                ('permission_id', 'auth_permission', 'id', 'Invalid permission_id')
            ],
            'accounts_user_groups': [
                ('user_id', 'accounts_user', 'id', 'Invalid user_id'),
                ('group_id', 'auth_group', 'id', 'Invalid group_id')
            ],
            'accounts_user_user_permissions': [
                ('user_id', 'accounts_user', 'id', 'Invalid user_id'),
                ('permission_id', 'auth_permission', 'id', 'Invalid permission_id')
            ],
            'staff_shift': [
                ('approved_by_id', 'accounts_user', 'id', 'Invalid approved_by_id', True),
                ('club_id', 'core_club', 'id', 'Invalid club_id')
            ],
            'staff_staffattendance': [
                ('staff_id', 'accounts_user', 'id', 'Invalid staff_id'),
                ('club_id', 'core_club', 'id', 'Invalid club_id'),
                ('shift_id', 'staff_shift', 'id', 'Invalid shift_id')
            ],
            'subscriptions_subscription': [
                ('club_id', 'core_club', 'id', 'Invalid club_id'),
                ('member_id', 'members_member', 'id', 'Invalid member_id'),
                ('type_id', 'subscriptions_subscriptiontype', 'id', 'Invalid type_id'),
                ('coach_id', 'accounts_user', 'id', 'Invalid coach_id', True)
            ],
            'subscriptions_privatesubscriptionpayment': [
                ('subscription_id', 'subscriptions_subscription', 'id', 'Invalid subscription_id'),
                ('club_id', 'core_club', 'id', 'Invalid club_id')
            ],
            'payroll_payrollperiod': [
                ('club_id', 'core_club', 'id', 'Invalid club_id')
            ],
            'payroll_payroll': [
                ('employee_id', 'accounts_user', 'id', 'Invalid employee_id'),
                ('club_id', 'core_club', 'id', 'Invalid club_id'),
                ('period_id', 'payroll_payrollperiod', 'id', 'Invalid period_id')
            ],
            'payroll_payrolldeduction': [
                ('payroll_id', 'payroll_payroll', 'id', 'Invalid payroll_id')
            ],
            'payroll_employeecontract': [
                ('employee_id', 'accounts_user', 'id', 'Invalid employee_id'),
                ('club_id', 'core_club', 'id', 'Invalid club_id')
            ],
            'payroll_coachpercentage': [
                ('coach_id', 'accounts_user', 'id', 'Invalid coach_id'),
                ('club_id', 'core_club', 'id', 'Invalid club_id')
            ],
            'receipts_receipt': [
                ('club_id', 'core_club', 'id', 'Invalid club_id'),
                ('member_id', 'members_member', 'id', 'Invalid member_id'),
                ('entry_log_id', 'attendance_entrylog', 'id', 'Invalid entry_log_id', True),
                ('issued_by_id', 'accounts_user', 'id', 'Invalid issued_by_id')
            ],
            'attendance_entrylog': [
                ('club_id', 'core_club', 'id', 'Invalid club_id'),
                ('member_id', 'members_member', 'id', 'Invalid member_id'),
                ('approved_by_id', 'accounts_user', 'id', 'Invalid approved_by_id', True),
                ('related_subscription_id', 'subscriptions_subscription', 'id', 'Invalid related_subscription_id', True)
            ],
            'attendance_attendance': [
                ('subscription_id', 'subscriptions_subscription', 'id', 'Invalid subscription_id')
            ]
        }
        if table in foreign_key_checks:
            for field, ref_table, ref_field, error_msg, nullable in foreign_key_checks[table]:
                value = row_data.get(field)
                if value is None and nullable:
                    continue
                cursor.execute(f"SELECT COUNT(*) FROM {ref_table} WHERE {ref_field} = ?", (value,))
                if cursor.fetchone()[0] == 0:
                    return False, f"{error_msg}: {value}"
        conn.close()
        return True, ""
    except sqlite3.OperationalError as e:
        return False, f"Error checking foreign keys: {e}"

def get_table_size(db_path, table_name):
    """Estimate the size of a table in bytes with improved accuracy."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(f"SELECT COUNT(*) FROM \"{table_name}\"")
        row_count = cursor.fetchone()[0]
        size = 0
        if row_count > 0:
            cursor.execute(f"PRAGMA table_info(\"{table_name}\")")
            columns = [(row[1], row[2].lower()) for row in cursor.fetchall()]
            query = f"SELECT " + ", ".join([f"IFNULL(LENGTH(\"{col[0]}\"), 0)" for col in columns]) + f" FROM \"{table_name}\""
            cursor.execute(query)
            for row in cursor.fetchall():
                size += sum(l for l in row)
            for col_name, col_type in columns:
                if 'int' in col_type:
                    size += row_count * 4
                elif 'real' in col_type or 'float' in col_type or 'decimal' in col_type:
                    size += row_count * 8
                elif 'datetime' in col_type or 'date' in col_type:
                    size += row_count * 8
                elif 'time' in col_type:
                    size += row_count * 4
        conn.close()
        return size
    except sqlite3.OperationalError as e:
        logger.error(f"Error estimating size for {table_name}: {e}")
        return 0

def validate_migration(old_db_path, new_db_path):
    """Validate the migration by comparing record counts and sizes."""
    logger.info("\n=== Validating Migration ===")
    conn_old = sqlite3.connect(old_db_path)
    conn_new = sqlite3.connect(new_db_path)
    cursor_old = conn_old.cursor()
    cursor_new = conn_new.cursor()
    cursor_old.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor_old.fetchall() if not row[0].startswith('sqlite_') or row[0] == 'sqlite_sequence']
    errors = []
    total_old_size = 0
    total_new_size = 0
    logger.info(f"{'Table':<30} {'Old Records':<12} {'New Records':<12} {'Old Size (bytes)':<16} {'New Size (bytes)':<16}")
    logger.info("-" * 90)
    for table in tables:
        if table == 'django_migrations':
            continue
        cursor_old.execute(f"SELECT COUNT(*) FROM \"{table}\"")
        old_count = cursor_old.fetchone()[0]
        cursor_new.execute(f"SELECT COUNT(*) FROM \"{table}\"")
        new_count = cursor_new.fetchone()[0]
        old_size = get_table_size(old_db_path, table)
        new_size = get_table_size(new_db_path, table)
        total_old_size += old_size
        total_new_size += new_size
        logger.info(f"{table:<30} {old_count:<12} {new_count:<12} {old_size:<16} {new_size:<16}")
        if old_count != new_count:
            errors.append(f"Error in {table}: Old {old_count}, New {new_count}")
    conn_old.close()
    conn_new.close()
    logger.info(f"\nTotal sizes (estimated):")
    logger.info(f"Old database: {total_old_size} bytes (~{total_old_size / 1024 / 1024:.2f} MB)")
    logger.info(f"New database: {total_new_size} bytes (~{total_new_size / 1024 / 1024:.2f} MB)")
    if errors:
        logger.error(f"\nFound {len(errors)} errors:")
        for error in errors:
            logger.error(error)
    else:
        logger.info("\nAll tables migrated successfully!")

def migrate_data(old_db_path, new_db_path, default_values=None):
    """Migrate data from old database to new database."""
    # Set the new database
    settings.DATABASES['default']['NAME'] = new_db_path

    # Clear existing data
    logger.info("Clearing data from the new database...")
    call_command('flush', interactive=False)
    logger.info("Applying migrations...")
    call_command('migrate')

    # Default values for new columns
    default_values = default_values or {
        'accounts.User.role': 'reception',
        'accounts.User.phone': '',
        'accounts.User.birth_date': None,
        'accounts.User.qualifications': '',
        'subscriptions.SubscriptionType.is_active': True,
        'subscriptions.SubscriptionType.max_entries': 0,
        'subscriptions.SubscriptionType.is_private': False,
        'subscriptions.SubscriptionType.private_fee': None,
        'subscriptions.Subscription.coach': None,
        'subscriptions.Subscription.entry_count': 0,
        'subscriptions.Subscription.remaining_amount': 0,
        'subscriptions.PrivateSubscriptionPayment.coach_share': lambda: 0.0,
        'attendance.Attendance.entry_time': None,
        'attendance.EntryLog.approved_by': None,
        'attendance.EntryLog.related_subscription': None,
        'receipts.Receipt.entry_type': 'ENTRY',
        'receipts.Receipt.entry_log': None,
        'staff.Shift.shift_end_date': None,
        'staff.Shift.approved_by': None,
        'finance.Expense.invoice_number': None,
        'finance.Income.related_receipt': None,
        'tickets.Ticket.used': False,
        'payroll.PayrollPeriod.is_active': True,
        'payroll.Payroll.is_finalized': False,
        'payroll.Payroll.total_deductions': 0.0,
        'payroll.EmployeeContract.end_date': None,
        'payroll.CoachPercentage.coach_percentage': 70.0,
        'payroll.CoachPercentage.club_percentage': 30.0,
    }

    # Table order based on dependencies
    table_order = [
        'core_club',
        'django_content_type',
        'auth_permission',
        'auth_group',
        'accounts_user',
        'auth_group_permissions',
        'accounts_user_groups',
        'accounts_user_user_permissions',
        'django_admin_log',
        'members_member',
        'subscriptions_subscriptiontype',
        'subscriptions_subscription',
        'subscriptions_privatesubscriptionpayment',
        'attendance_attendance',
        'attendance_entrylog',
        'receipts_receipt',
        'finance_expensecategory',
        'finance_expense',
        'finance_incomesource',
        'finance_income',
        'invites_freeinvite',
        'staff_shift',
        'staff_staffattendance',
        'payroll_payrollperiod',
        'payroll_employeecontract',
        'payroll_coachpercentage',
        'payroll_payroll',
        'payroll_payrolldeduction',
        'tickets_ticket',
        'user_visit_uservisit',
        'devices_allowedip',
        'devices_devicesettings',
        'devices_extendeduservisit',
        'devices_alloweddevice',
        'devices_historicalalloweddevice',
        'token_blacklist_outstandingtoken',
        'token_blacklist_blacklistedtoken',
        'django_session',
        'sqlite_sequence',
        'django_migrations',  # Last due to expected differences
    ]

    for table in table_order:
        model = None
        for m in apps.get_models():
            if m._meta.db_table == table:
                model = m
                break
        if not model and table != 'sqlite_sequence':
            logger.warning(f"Table {table} not found in models")
            continue

        model_name = f"{model._meta.app_label}.{model._meta.model_name}" if model else table
        old_columns, rows = get_table_data(old_db_path, table)
        if not rows:
            logger.info(f"Table {table} is empty")
            continue

        logger.info(f"Migrating table {table} ({len(rows)} records)...")
        if table == 'sqlite_sequence':
            try:
                conn_new = sqlite3.connect(new_db_path)
                cursor_new = conn_new.cursor()
                cursor_new.execute("DELETE FROM sqlite_sequence")
                for row in rows:
                    cursor_new.execute("INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)", row)
                conn_new.commit()
                conn_new.close()
                logger.info(f"Table {table} migrated successfully")
            except sqlite3.OperationalError as e:
                logger.error(f"Error migrating {table}: {e}")
            continue

        new_fields = {field.name: field for field in model._meta.fields}
        new_field_names = set(new_fields.keys())
        old_field_names = set(old_columns)
        missing_fields = new_field_names - old_field_names

        batch = []
        errors = []
        for i, row in enumerate(rows):
            if i % 1000 == 0 and i > 0:
                logger.info(f"Processed {i}/{len(rows)} records for {table}")
            row_data = dict(zip(old_columns, row))

            # Check foreign keys
            if table in [
                'auth_group_permissions', 'accounts_user_groups', 'accounts_user_user_permissions',
                'staff_shift', 'staff_staffattendance', 'subscriptions_subscription',
                'subscriptions_privatesubscriptionpayment', 'payroll_payrollperiod',
                'payroll_payroll', 'payroll_payrolldeduction', 'payroll_employeecontract',
                'payroll_coachpercentage', 'receipts_receipt', 'attendance_entrylog',
                'attendance_attendance'
            ]:
                is_valid, error_msg = check_foreign_keys(table, row_data, new_db_path)
                if not is_valid:
                    errors.append(f"Skipping record in {table}: {error_msg}, Data: {row_data}")
                    continue

            # Handle missing fields
            for field in missing_fields:
                default_key = f"{model_name}.{field}"
                if default_key in default_values:
                    row_data[field] = default_values[default_key]() if callable(default_values[default_key]) else default_values[default_key]
                elif new_fields[field].has_default():
                    row_data[field] = new_fields[field].get_default()
                else:
                    if isinstance(new_fields[field], models.BooleanField):
                        row_data[field] = False
                    elif isinstance(new_fields[field], (models.CharField, models.TextField)):
                        row_data[field] = ""
                    elif isinstance(new_fields[field], (models.IntegerField, models.FloatField, models.DecimalField)):
                        row_data[field] = 0
                    elif isinstance(new_fields[field], models.DateTimeField):
                        row_data[field] = timezone.now()
                    elif isinstance(new_fields[field], models.DateField):
                        row_data[field] = timezone.now().date()
                    elif isinstance(new_fields[field], models.TimeField):
                        row_data[field] = None
                    else:
                        row_data[field] = None

            # Special handling for accounts_user.rfid_code
            if table == 'accounts_user' and not row_data.get('rfid_code'):
                row_data['rfid_code'] = f"RFID_{row_data.get('id', i)}_{timezone.now().strftime('%Y%m%d')}"

            batch.append(model(**row_data))
            if len(batch) >= 1000:
                try:
                    model.objects.bulk_create(batch, ignore_conflicts=True)
                    batch = []
                except Exception as e:
                    errors.append(f"Error migrating batch for {table}: {e}, Data: {batch[:5]}")
                    batch = []

        if batch:
            try:
                model.objects.bulk_create(batch, ignore_conflicts=True)
            except Exception as e:
                errors.append(f"Error migrating batch for {table}: {e}, Data: {batch[:5]}")

        if errors:
            logger.error(f"Table {table} migrated with {len(errors)} errors:")
            for error in errors:
                logger.error(error)
        else:
            logger.info(f"Table {table} migrated successfully")

    # Validate the migration
    validate_migration(old_db_path, new_db_path)

if __name__ == "__main__":
    OLD_DB_PATH = r"F:\club\clubx\src\db_old_old.sqlite3"
    NEW_DB_PATH = r"F:\club\clubx\src\db.sqlite3"
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
    import django
    django.setup()
    migrate_data(OLD_DB_PATH, NEW_DB_PATH)