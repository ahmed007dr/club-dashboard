import sqlite3
import os
import logging
from contextlib import contextmanager
from dateutil.parser import parse
from django.conf import settings
from django.apps import apps
from django.core.management import call_command
from django.db import models, connection
from django.utils import timezone
from datetime import datetime
from django.db.models import DateTimeField, BooleanField, CharField, TextField, IntegerField, FloatField, DecimalField, DateField, TimeField
import pytz
from django.utils.dateparse import parse_datetime
import shutil

# Configure logging with UTF-8 encoding
logging.basicConfig(
    level=logging.INFO,
    filename='migration.log',
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

def copy_file_if_exists(src_path, dest_path):
    """Copy a file from source to destination if it exists."""
    try:
        if src_path and os.path.exists(src_path):
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            shutil.copy2(src_path, dest_path)
            logger.info(f"Copied file from {src_path} to {dest_path}")
            return True
        else:
            logger.warning(f"File not found: {src_path}")
            return False
    except Exception as e:
        logger.error(f"Error copying file from {src_path} to {dest_path}: {e}")
        return False

def get_default_club_id(new_db_path):
    """Get the ID of the first Club in the new database."""
    try:
        with get_db_connection(new_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM core_club LIMIT 1")
            result = cursor.fetchone()
            return result[0] if result else None
    except sqlite3.OperationalError as e:
        logger.error(f"Error fetching default club_id: {e}")
        return None

def get_payment_method_mapping(new_db_path):
    """Create a mapping of (name, club_id) to id for PaymentMethod in the new database."""
    try:
        with get_db_connection(new_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, club_id FROM subscriptions_paymentmethod")
            mapping = {(row[1], row[2]): row[0] for row in cursor.fetchall()}
            logger.info(f"PaymentMethod mapping: {mapping}")
            return mapping
    except sqlite3.OperationalError as e:
        logger.error(f"Error fetching PaymentMethod mapping: {e}")
        return {}

def migrate_table(model, table_name, old_db_path, new_db_path, migration_summary, default_values=None, old_media_path=None, new_media_path=None, default_payment_method=None, payment_method_mapping=None):
    """Migrate data for a single table with error handling, foreign key validation, and file copying."""
    if default_values is None:
        default_values = {}
    if payment_method_mapping is None:
        payment_method_mapping = {}

    model_name = f"{model._meta.app_label}.{model._meta.model_name}"
    old_columns, rows, total_records = get_table_data(old_db_path, table_name)
    if not rows:
        logger.info(f"Table {table_name} is empty")
        migration_summary[table_name] = {'total': 0, 'success': 0, 'failed': 0}
        return

    logger.info(f"Migrating table {table_name} ({total_records} records)...")
    migration_summary[table_name] = {'total': total_records, 'success': 0, 'failed': 0}

    new_fields = {field.name: field for field in model._meta.fields}
    new_field_names = set(new_fields.keys())
    old_field_names = set(old_columns)
    missing_fields = new_field_names - old_field_names
    logger.info(f"Missing fields in {table_name}: {missing_fields}")

    batch = []
    errors = []
    feature_mappings = {}
    invalid_type_ids = set()

    # Initialize feature_mappings for subscriptions_subscriptiontype
    if table_name == 'subscriptions_subscriptiontype':
        try:
            with get_db_connection(new_db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id, name, club_id FROM subscriptions_feature")
                for row in cursor.fetchall():
                    feature_id, feature_name, club_id = row
                    if club_id not in feature_mappings:
                        feature_mappings[club_id] = {}
                    feature_mappings[club_id][feature_name] = feature_id
            logger.info(f"Feature mappings: {feature_mappings}")
        except sqlite3.OperationalError as e:
            logger.error(f"Error initializing feature_mappings: {e}")

    # Validate subscription type_ids
    if table_name == 'subscriptions_subscription':
        valid_type_ids = set()
        try:
            with get_db_connection(new_db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM subscriptions_subscriptiontype")
                valid_type_ids = {row[0] for row in cursor.fetchall()}
            logger.info(f"Valid type_ids in new database: {valid_type_ids}")
        except sqlite3.OperationalError as e:
            logger.error(f"Error fetching valid type_ids: {e}")

    for row_index, row in enumerate(rows):
        row_data = dict(zip(old_columns, row))
        row_data['row_index'] = row_index

        # Foreign key checks
        if table_name == 'invites_freeinvite':
            for fk_field in ['invited_by_id', 'created_by_id', 'subscription_id']:
                value = row_data.get(fk_field)
                if value and not check_foreign_key(
                    {'invited_by_id': 'members_member', 'created_by_id': 'accounts_user', 'subscription_id': 'subscriptions_subscription'}[fk_field],
                    'id', value, new_db_path
                ):
                    errors.append(f"Skipping record in {table_name} (row {row_index}): invalid {fk_field}: {value}, data: {row_data}")
                    migration_summary[table_name]['failed'] += 1
                    continue

        if table_name == 'subscriptions_subscriptiontype':
            for field in ['includes_gym', 'includes_pool', 'includes_classes']:
                row_data.pop(field, None)

        # Remove unexpected fields
        if table_name in ['finance_expense', 'finance_income', 'finance_stocktransaction']:
            row_data.pop('cash_journal_id', None)

        # Handle payment_method_id for subscriptions_payment
        if table_name == 'subscriptions_payment':
            payment_method_id = row_data.get('payment_method_id')
            if payment_method_id and not check_foreign_key('subscriptions_paymentmethod', 'id', payment_method_id, new_db_path):
                row_data['payment_method_id'] = default_payment_method.id if default_payment_method else None
                logger.warning(f"Invalid payment_method_id {payment_method_id} in subscriptions_payment (row {row_index}); using default: {row_data['payment_method_id']}")

        # Handle missing fields
        for field in missing_fields:
            default_key = f"{model_name}.{field}"
            if default_key in default_values:
                row_data[field] = default_values[default_key](row_data) if callable(default_values[default_key]) else default_values[default_key]
            elif new_fields[field].has_default():
                row_data[field] = new_fields[field].get_default()
            else:
                if isinstance(new_fields[field], BooleanField):
                    row_data[field] = False
                elif isinstance(new_fields[field], (CharField, TextField)):
                    row_data[field] = ""
                elif isinstance(new_fields[field], (IntegerField, FloatField, DecimalField)):
                    row_data[field] = 0
                elif isinstance(new_fields[field], DateTimeField):
                    row_data[field] = timezone.now()
                elif isinstance(new_fields[field], DateField):
                    row_data[field] = timezone.now().date()
                elif isinstance(new_fields[field], TimeField):
                    row_data[field] = None
                else:
                    row_data[field] = None

        # Handle datetime fields
        for field, value in row_data.items():
            if isinstance(new_fields.get(field), DateTimeField) and value:
                if isinstance(value, str):
                    try:
                        value = parse(value)
                        row_data[field] = timezone.make_aware(value, timezone.get_default_timezone()) if timezone.is_naive(value) else value
                    except ValueError as e:
                        errors.append(f"Error parsing date {field} in {table_name} (row {row_index}): {value}, error: {e}")
                        migration_summary[table_name]['failed'] += 1
                        continue
                elif isinstance(value, datetime) and timezone.is_naive(value):
                    row_data[field] = timezone.make_aware(value, timezone.get_default_timezone())

        # Handle file fields
        if table_name in ['core_club', 'members_member', 'finance_expense']:
            file_field = {'core_club': 'logo', 'members_member': 'photo', 'finance_expense': 'attachment'}.get(table_name)
            if file_field and row_data.get(file_field):
                src_path = os.path.join(old_media_path, row_data[file_field]) if old_media_path else row_data[file_field]
                dest_path = os.path.join(new_media_path, row_data[file_field]) if new_media_path else row_data[file_field]
                copy_file_if_exists(src_path, dest_path)

        row_data.pop('row_index', None)

        try:
            obj = model(**row_data)
            batch.append(obj)
        except Exception as e:
            errors.append(f"Error creating object for {table_name} (row {row_index}): {e}, data: {row_data}")
            migration_summary[table_name]['failed'] += 1
            continue

        if len(batch) >= 500:
            try:
                model.objects.bulk_create(batch, ignore_conflicts=True)
                migration_summary[table_name]['success'] += len(batch)
                if table_name == 'subscriptions_subscriptiontype':
                    for obj in batch:
                        club_id = obj.club_id
                        old_row = next((r for r in rows if r[old_columns.index('id')] == obj.id), None)
                        if old_row:
                            old_data = dict(zip(old_columns, old_row))
                            features_to_add = []
                            if old_data.get('includes_gym') and feature_mappings.get(club_id, {}).get('Gym'):
                                features_to_add.append(feature_mappings[club_id]['Gym'])
                            if old_data.get('includes_pool') and feature_mappings.get(club_id, {}).get('Pool'):
                                features_to_add.append(feature_mappings[club_id]['Pool'])
                            if old_data.get('includes_classes') and feature_mappings.get(club_id, {}).get('Classes'):
                                features_to_add.append(feature_mappings[club_id]['Classes'])
                            if features_to_add:
                                obj.features.set(features_to_add)
                batch = []
            except Exception as e:
                errors.append(f"Error saving batch for {table_name}: {e}, data: {[str(dict(obj.__dict__)) for obj in batch[:5]]}")
                migration_summary[table_name]['failed'] += len(batch)
                batch = []

    if batch:
        try:
            model.objects.bulk_create(batch, ignore_conflicts=True)
            migration_summary[table_name]['success'] += len(batch)
            if table_name == 'subscriptions_subscriptiontype':
                for obj in batch:
                    club_id = obj.club_id
                    old_row = next((r for r in rows if r[old_columns.index('id')] == obj.id), None)
                    if old_row:
                        old_data = dict(zip(old_columns, old_row))
                        features_to_add = []
                        if old_data.get('includes_gym') and feature_mappings.get(club_id, {}).get('Gym'):
                            features_to_add.append(feature_mappings[club_id]['Gym'])
                        if old_data.get('includes_pool') and feature_mappings.get(club_id, {}).get('Pool'):
                            features_to_add.append(feature_mappings[club_id]['Pool'])
                        if old_data.get('includes_classes') and feature_mappings.get(club_id, {}).get('Classes'):
                            features_to_add.append(feature_mappings[club_id]['Classes'])
                        if features_to_add:
                            obj.features.set(features_to_add)
        except Exception as e:
            errors.append(f"Error saving final batch for {table_name}: {e}, data: {[str(dict(obj.__dict__)) for obj in batch[:5]]}")
            migration_summary[table_name]['failed'] += len(batch)
            batch = []

    if errors:
        logger.info(f"Completed migration of {table_name} with {len(errors)} errors")
        for error in errors[:10]:
            logger.error(error)
        if table_name == 'subscriptions_subscription' and invalid_type_ids:
            logger.warning(f"Invalid type_ids found: {invalid_type_ids}")
    else:
        logger.info(f"Completed migration of {table_name} successfully")

def migrate_all_required_tables(old_db_path, new_db_path, old_media_path, new_media_path):
    """Migrate data for all required tables."""
    settings.DATABASES['default']['NAME'] = new_db_path
    migration_summary = {}
    errors = []
    logger.info("Flushing database...")
    try:
        call_command('flush', interactive=False)
    except Exception as e:
        logger.error(f"Error flushing database: {e}")
        return migration_summary, errors

    logger.info("Applying migrations...")
    try:
        call_command('migrate')
    except Exception as e:
        logger.error(f"Error applying migrations: {e}")
        return migration_summary, errors

    # Create default PaymentMethod after core_club migration
    default_payment_method = None

    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        logger.info(f"Tables in new database: {tables}")

    global models
    models = {}
    for m in apps.get_models():
        if m._meta.db_table in [
            'core_club',
            'accounts_user',
            'members_member',
            'subscriptions_subscriptiontype',
            'subscriptions_feature',
            'subscriptions_paymentmethod',
            'subscriptions_subscription',
            'subscriptions_payment',
            'subscriptions_freezerequest',
            'subscriptions_coachprofile',
            'subscriptions_specialoffer',
            'attendance_attendance',
            'attendance_entrylog',
            'staff_shift',
            'staff_staffattendance',
            'finance_expensecategory',
            'finance_expense',
            'finance_incomesource',
            'finance_income',
            'finance_stockitem',
            'finance_stocktransaction',
            'invites_freeinvite',
            'tickets_tickettype',
            'tickets_ticket',
        ]:
            models[m._meta.db_table] = m

    # Table order ensures foreign key dependencies are respected
    tables = [
        'core_club',                    # Base table, no dependencies
        'accounts_user',                # Depends on core_club
        'members_member',               # Depends on core_club
        'subscriptions_feature',        # Depends on core_club
        'subscriptions_paymentmethod',  # Depends on core_club
        'subscriptions_subscriptiontype', # Depends on core_club, subscriptions_feature
        'subscriptions_subscription',   # Depends on core_club, accounts_user, members_member, subscriptions_subscriptiontype
        'subscriptions_payment',        # Depends on subscriptions_subscription, subscriptions_paymentmethod
        'subscriptions_freezerequest',  # Depends on subscriptions_subscription
        'subscriptions_coachprofile',   # Depends on accounts_user
        'subscriptions_specialoffer',   # Depends on core_club, subscriptions_subscriptiontype
        'attendance_attendance',        # Depends on subscriptions_subscription, accounts_user
        'attendance_entrylog',         # Depends on core_club, members_member, subscriptions_subscription
        'staff_shift',                 # Depends on core_club, accounts_user
        'staff_staffattendance',       # Depends on core_club, accounts_user, staff_shift
        'finance_expensecategory',     # Depends on core_club
        'finance_stockitem',           # Depends on core_club
        'finance_expense',             # Depends on core_club, finance_expensecategory, accounts_user, finance_stockitem
        'finance_incomesource',        # Depends on core_club, finance_stockitem
        'finance_income',              # Depends on core_club, finance_incomesource, accounts_user, finance_stocktransaction
        'finance_stocktransaction',    # Depends on finance_stockitem, finance_expense, finance_income
        'invites_freeinvite',          # Depends on core_club, members_member, subscriptions_subscription
        'tickets_tickettype',          # Depends on core_club
        'tickets_ticket',              # Depends on core_club, tickets_tickettype, accounts_user
    ]

    # Initialize payment method mapping
    payment_method_mapping = get_payment_method_mapping(new_db_path)

    # Migrate core_club first to ensure club_id availability
    migrate_table(models['core_club'], 'core_club', old_db_path, new_db_path, migration_summary, old_media_path=old_media_path, new_media_path=new_media_path)

    # Create default PaymentMethod after core_club migration
    try:
        from subscriptions.models import PaymentMethod
        default_club_id = get_default_club_id(new_db_path)
        if default_club_id:
            default_payment_method, created = PaymentMethod.objects.get_or_create(
                name="Cash",
                club_id=default_club_id,
                defaults={'is_active': True, 'created_at': timezone.now()}
            )
            logger.info(f"Default PaymentMethod {'created' if created else 'found'}: {default_payment_method}")
            # Update payment method mapping
            payment_method_mapping[("Cash", default_club_id)] = default_payment_method.id
        else:
            logger.warning("No Club found in new database; skipping default PaymentMethod creation")
            default_payment_method = None
    except Exception as e:
        logger.error(f"Error creating default PaymentMethod: {e}")
        default_payment_method = None

    # Migrate subscriptions_paymentmethod with mapping
    if 'subscriptions_paymentmethod' in models:
        old_columns, rows, total_records = get_table_data(old_db_path, 'subscriptions_paymentmethod')
        if rows:
            logger.info(f"Migrating table subscriptions_paymentmethod ({total_records} records)...")
            migration_summary['subscriptions_paymentmethod'] = {'total': total_records, 'success': 0, 'failed': 0}
            batch = []
            for row_index, row in enumerate(rows):
                row_data = dict(zip(old_columns, row))
                row_data['row_index'] = row_index
                name = row_data.get('name')
                club_id = row_data.get('club_id')
                old_id = row_data.get('id')

                # Check if PaymentMethod exists
                if (name, club_id) in payment_method_mapping:
                    payment_method_mapping[(name, club_id)] = payment_method_mapping[(name, club_id)]
                    logger.info(f"PaymentMethod {name} for club {club_id} already exists with id {payment_method_mapping[(name, club_id)]}")
                    migration_summary['subscriptions_paymentmethod']['success'] += 1
                    continue

                # Validate club_id
                if not check_foreign_key('core_club', 'id', club_id, new_db_path):
                    errors.append(f"Skipping record in subscriptions_paymentmethod (row {row_index}): invalid club_id: {club_id}, data: {row_data}")
                    migration_summary['subscriptions_paymentmethod']['failed'] += 1
                    continue

                try:
                    obj = models['subscriptions_paymentmethod'](**row_data)
                    batch.append(obj)
                    payment_method_mapping[(name, club_id)] = old_id  # Temporary mapping
                except Exception as e:
                    errors.append(f"Error creating object for subscriptions_paymentmethod (row {row_index}): {e}, data: {row_data}")
                    migration_summary['subscriptions_paymentmethod']['failed'] += 1
                    continue

                if len(batch) >= 500:
                    try:
                        model.objects.bulk_create(batch, ignore_conflicts=True)
                        migration_summary['subscriptions_paymentmethod']['success'] += len(batch)
                        # Update mapping with new IDs
                        for obj in batch:
                            payment_method_mapping[(obj.name, obj.club_id)] = obj.id
                        batch = []
                    except Exception as e:
                        errors.append(f"Error saving batch for subscriptions_paymentmethod: {e}, data: {[str(dict(obj.__dict__)) for obj in batch[:5]]}")
                        migration_summary['subscriptions_paymentmethod']['failed'] += len(batch)
                        batch = []

            if batch:
                try:
                    model.objects.bulk_create(batch, ignore_conflicts=True)
                    migration_summary['subscriptions_paymentmethod']['success'] += len(batch)
                    # Update mapping with new IDs
                    for obj in batch:
                        payment_method_mapping[(obj.name, obj.club_id)] = obj.id
                except Exception as e:
                    errors.append(f"Error saving final batch for subscriptions_paymentmethod: {e}, data: {[str(dict(obj.__dict__)) for obj in batch[:5]]}")
                    migration_summary['subscriptions_paymentmethod']['failed'] += len(batch)
                    batch = []

            if errors:
                logger.info(f"Completed migration of subscriptions_paymentmethod with {len(errors)} errors")
                for error in errors[:10]:
                    logger.error(error)
            else:
                logger.info(f"Completed migration of subscriptions_paymentmethod successfully")

    # Migrate remaining tables
    for table in tables[1:]:  # Skip core_club as it’s already migrated
        if table == 'subscriptions_paymentmethod':
            continue  # Already handled
        if not models.get(table):
            logger.warning(f"Model {table} not found")
            migration_summary[table] = {'total': 0, 'success': 0, 'failed': 0}
            continue
        migrate_table(
            models[table], table, old_db_path, new_db_path, migration_summary,
            default_values={
                'accounts.User.phone_number': None,
                'accounts.User.card_number': None,
                'accounts.User.address': "",
                'accounts.User.notes': "",
                'accounts.User.club': None,
                'accounts.User.hourly_rate': 0.00,
                'accounts.User.expected_hours': 176.0,
                'members.Member.club': None,
                'members.Member.referred_by': None,
                'subscriptions.Feature.is_active': True,
                'subscriptions.SubscriptionType.is_private_training': False,
                'subscriptions.SubscriptionType.max_freeze_days': 0,
                'subscriptions.SubscriptionType.max_entries': 0,
                'subscriptions.SubscriptionType.is_active': True,
                'subscriptions.SubscriptionType.free_invites_allowed': 1,
                'subscriptions.SubscriptionType.is_golden_only': False,
                'subscriptions.PaymentMethod.is_active': True,
                'subscriptions.Subscription.coach': None,
                'subscriptions.Subscription.created_by': None,
                'subscriptions.Subscription.remaining_amount': 0,
                'subscriptions.Subscription.coach_compensation_type': 'from_subscription',
                'subscriptions.Subscription.coach_compensation_value': 0.00,
                'subscriptions.Subscription.is_cancelled': False,
                'subscriptions.Subscription.refund_amount': 0.00,
                'subscriptions.Subscription.paid_amount': 0.00,
                'subscriptions.Subscription.entry_count': 0,
                'subscriptions.Payment.transaction_id': None,
                'subscriptions.Payment.notes': "",
                'subscriptions.FreezeRequest.is_active': True,
                'subscriptions.FreezeRequest.cancelled_at': None,
                'subscriptions.CoachProfile.max_trainees': 0,
                'subscriptions.SpecialOffer.is_active': True,
                'subscriptions.SpecialOffer.is_golden': False,
                'attendance.Attendance.approved_by': None,
                'attendance.EntryLog.approved_by': None,
                'staff.Shift.approved_by': None,
                'staff.StaffAttendance.created_by': None,
                'finance.ExpenseCategory.is_stock_related': False,
                'finance.Expense.description': "",
                'finance.Expense.paid_by': None,
                'finance.Expense.attachment': None,
                'finance.Expense.stock_item': None,
                'finance.Expense.stock_quantity': None,
                'finance.Expense.related_employee': None,
                'finance.IncomeSource.price': 0.00,
                'finance.IncomeSource.description': "",
                'finance.IncomeSource.stock_item': None,
                'finance.Income.received_by': None,
                'finance.Income.description': "",
                'finance.Income.stock_transaction': None,
                'finance.Income.payment_method': lambda row_data: default_payment_method.id if default_payment_method else None,
                'finance.StockItem.description': "",
                'finance.StockItem.initial_quantity': 0,
                'finance.StockItem.current_quantity': 0,
                'finance.StockItem.is_sellable': True,
                'finance.StockTransaction.description': "",
                'finance.StockTransaction.related_expense': None,
                'finance.StockTransaction.related_income': None,
                'finance.StockTransaction.created_by': None,
                'invites.FreeInvite.invited_by': None,
                'invites.FreeInvite.created_by': None,
                'invites.FreeInvite.subscription': None,
                'tickets.TicketType.description': "",
                'tickets.Ticket.serial_number': None,
            }.get(table, {}),
            old_media_path=old_media_path,
            new_media_path=new_media_path,
            default_payment_method=default_payment_method,
            payment_method_mapping=payment_method_mapping
        )

    logger.info("Listing migrated subscription types in new database...")
    try:
        with get_db_connection(new_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, name FROM subscriptions_subscriptiontype")
            types = cursor.fetchall()
            logger.info(f"Migrated subscription types: {types}")
    except sqlite3.OperationalError as e:
        logger.error(f"Error listing subscription types: {e}")

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
    # Ensure UTF-8 encoding for console output
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    OLD_DB_PATH = r"F:\club\gym\src\db_old.sqlite3"
    NEW_DB_PATH = r"F:\club\gym\src\db.sqlite3"
    OLD_MEDIA_PATH = r"F:\club\gym\src\media"
    NEW_MEDIA_PATH = r"F:\club\gym\src\media"
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
    import django
    django.setup()
    migration_summary, errors = migrate_all_required_tables(OLD_DB_PATH, NEW_DB_PATH, OLD_MEDIA_PATH, NEW_MEDIA_PATH)
    print_summary(migration_summary)
    print_detailed_errors(migration_summary, errors)