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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    filename='migration.log',
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

def migrate_table(model, table_name, old_db_path, new_db_path, migration_summary, default_values=None):
    """Migrate data for a single table with error handling and foreign key validation."""
    if default_values is None:
        default_values = {}

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

        if table_name == 'subscriptions_subscriptiontype':
            for field in ['includes_gym', 'includes_pool', 'includes_classes']:
                row_data.pop(field, None)
            club_id = row_data.get('club_id')
            if club_id:
                try:
                    with get_db_connection(new_db_path) as conn:
                        cursor = conn.cursor()
                        cursor.execute("SELECT id, name FROM subscriptions_feature WHERE club_id = ?", (club_id,))
                        features = cursor.fetchall()
                        feature_mappings[club_id] = {name: fid for fid, name in features}
                except sqlite3.OperationalError as e:
                    errors.append(f"Error fetching features for club {club_id}: {e}")
                    migration_summary[table_name]['failed'] += 1
                    continue

        if table_name == 'subscriptions_subscription':
            private_training_price = row_data.pop('private_training_price', 0)
            if private_training_price and private_training_price > 0:
                row_data['coach_compensation_value'] = private_training_price

            member_id = row_data.get('member_id')
            if member_id and not check_foreign_key('members_member', 'id', member_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid member_id: {member_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            type_id = row_data.get('type_id')
            if type_id and not check_foreign_key('subscriptions_subscriptiontype', 'id', type_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid type_id: {type_id}, data: {row_data}")
                invalid_type_ids.add(type_id)
                migration_summary[table_name]['failed'] += 1
                continue

            coach_id = row_data.get('coach_id')
            if coach_id and not check_foreign_key('accounts_user', 'id', coach_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid coach_id: {coach_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            created_by_id = row_data.get('created_by_id')
            if created_by_id and not check_foreign_key('accounts_user', 'id', created_by_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid created_by_id: {created_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'subscriptions_payment':
            subscription_id = row_data.get('subscription_id')
            if subscription_id and not check_foreign_key('subscriptions_subscription', 'id', subscription_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid subscription_id: {subscription_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            payment_method_id = row_data.get('payment_method_id')
            if payment_method_id and not check_foreign_key('subscriptions_paymentmethod', 'id', payment_method_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid payment_method_id: {payment_method_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'subscriptions_freezerequest':
            subscription_id = row_data.get('subscription_id')
            if subscription_id and not check_foreign_key('subscriptions_subscription', 'id', subscription_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid subscription_id: {subscription_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            created_by_id = row_data.get('created_by_id')
            if created_by_id and not check_foreign_key('accounts_user', 'id', created_by_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid created_by_id: {created_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'subscriptions_coachprofile':
            user_id = row_data.get('user_id')
            if user_id and not check_foreign_key('accounts_user', 'id', user_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid user_id: {user_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'subscriptions_specialoffer':
            subscription_type_id = row_data.get('subscription_type_id')
            if subscription_type_id and not check_foreign_key('subscriptions_subscriptiontype', 'id', subscription_type_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid subscription_type_id: {subscription_type_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'attendance_attendance':
            subscription_id = row_data.get('subscription_id')
            if subscription_id and not check_foreign_key('subscriptions_subscription', 'id', subscription_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid subscription_id: {subscription_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            approved_by_id = row_data.get('approved_by_id')
            if approved_by_id and not check_foreign_key('accounts_user', 'id', approved_by_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid approved_by_id: {approved_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'attendance_entrylog':
            member_id = row_data.get('member_id')
            if member_id and not check_foreign_key('members_member', 'id', member_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid member_id: {member_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            approved_by_id = row_data.get('approved_by_id')
            if approved_by_id and not check_foreign_key('accounts_user', 'id', approved_by_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid approved_by_id: {approved_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            related_subscription_id = row_data.get('related_subscription_id')
            if related_subscription_id and not check_foreign_key('subscriptions_subscription', 'id', related_subscription_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid related_subscription_id: {related_subscription_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'staff_shift':
            staff_id = row_data.get('staff_id')
            if staff_id and not check_foreign_key('accounts_user', 'id', staff_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid staff_id: {staff_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            approved_by_id = row_data.get('approved_by_id')
            if approved_by_id and not check_foreign_key('accounts_user', 'id', approved_by_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid approved_by_id: {approved_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'staff_staffattendance':
            staff_id = row_data.get('staff_id')
            if staff_id and not check_foreign_key('accounts_user', 'id', staff_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid staff_id: {staff_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            shift_id = row_data.get('shift_id')
            if shift_id and not check_foreign_key('staff_shift', 'id', shift_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid shift_id: {shift_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            created_by_id = row_data.get('created_by_id')
            if created_by_id and not check_foreign_key('accounts_user', 'id', created_by_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid created_by_id: {created_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'finance_expense':
            category_id = row_data.get('category_id')
            if category_id and not check_foreign_key('finance_expensecategory', 'id', category_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid category_id: {category_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            paid_by_id = row_data.get('paid_by_id')
            if paid_by_id and not check_foreign_key('accounts_user', 'id', paid_by_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid paid_by_id: {paid_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            stock_item_id = row_data.get('stock_item_id')
            if stock_item_id and not check_foreign_key('finance_stockitem', 'id', stock_item_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid stock_item_id: {stock_item_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            related_employee_id = row_data.get('related_employee_id')
            if related_employee_id and not check_foreign_key('accounts_user', 'id', related_employee_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid related_employee_id: {related_employee_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'finance_income':
            source_id = row_data.get('source_id')
            if source_id and not check_foreign_key('finance_incomesource', 'id', source_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid source_id: {source_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            received_by_id = row_data.get('received_by_id')
            if received_by_id and not check_foreign_key('accounts_user', 'id', received_by_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid received_by_id: {received_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'finance_stocktransaction':
            stock_item_id = row_data.get('stock_item_id')
            if stock_item_id and not check_foreign_key('finance_stockitem', 'id', stock_item_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid stock_item_id: {stock_item_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            related_expense_id = row_data.get('related_expense_id')
            if related_expense_id and not check_foreign_key('finance_expense', 'id', related_expense_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid related_expense_id: {related_expense_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            related_income_id = row_data.get('related_income_id')
            if related_income_id and not check_foreign_key('finance_income', 'id', related_income_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid related_income_id: {related_income_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            created_by_id = row_data.get('created_by_id')
            if created_by_id and not check_foreign_key('accounts_user', 'id', created_by_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid created_by_id: {created_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'invites_freeinvite':
            invited_by_id = row_data.get('invited_by_id')
            if invited_by_id and not check_foreign_key('members_member', 'id', invited_by_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid invited_by_id: {invited_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            created_by_id = row_data.get('created_by_id')
            if created_by_id and not check_foreign_key('accounts_user', 'id', created_by_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid created_by_id: {created_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            subscription_id = row_data.get('subscription_id')
            if subscription_id and not check_foreign_key('subscriptions_subscription', 'id', subscription_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid subscription_id: {subscription_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'tickets_ticket':
            ticket_type_id = row_data.get('ticket_type_id')
            if ticket_type_id and not check_foreign_key('tickets_tickettype', 'id', ticket_type_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid ticket_type_id: {ticket_type_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            issued_by_id = row_data.get('issued_by_id')
            if issued_by_id and not check_foreign_key('accounts_user', 'id', issued_by_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid issued_by_id: {issued_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'subscriptions_specialoffer':
            subscription_type_id = row_data.get('subscription_type_id')
            if subscription_type_id and not check_foreign_key('subscriptions_subscriptiontype', 'id', subscription_type_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid subscription_type_id: {subscription_type_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        # if table_name == 'core_alloweddevice':
        #     user_id = row_data.get('user_id')
        #     if user_id and not check_foreign_key('accounts_user', 'id', user_id, new_db_path):
        #         errors.append(f"Skipping record in {table_name}: invalid user_id: {user_id}, data: {row_data}")
        #         migration_summary[table_name]['failed'] += 1
        #         continue

        # if table_name == 'core_extendeduservisit':
        #     user_visit_id = row_data.get('user_visit_id')
        #     if user_visit_id and not check_foreign_key('user_visit_uservisit', 'id', user_visit_id, new_db_path):
        #         errors.append(f"Skipping record in {table_name}: invalid user_visit_id: {user_visit_id}, data: {row_data}")
        #         migration_summary[table_name]['failed'] += 1
        #         continue

        # if table_name == 'core_schedule':
        #     club_id = row_data.get('club_id')
        #     if club_id and not check_foreign_key('core_club', 'id', club_id, new_db_path):
        #         errors.append(f"Skipping record in {table_name}: invalid club_id: {club_id}, data: {row_data}")
        #         migration_summary[table_name]['failed'] += 1
        #         continue

        #     created_by_id = row_data.get('created_by_id')
        #     if created_by_id and not check_foreign_key('accounts_user', 'id', created_by_id, new_db_path):
        #         errors.append(f"Skipping record in {table_name}: invalid created_by_id: {created_by_id}, data: {row_data}")
        #         migration_summary[table_name]['failed'] += 1
        #         continue

        if table_name in [
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
            'finance_expense',
            'finance_income',
            'finance_expensecategory',
            'finance_incomesource',
            'finance_stockitem',
            'finance_stocktransaction',
            'invites_freeinvite',
            'tickets_tickettype',
            'tickets_ticket',
            # 'core_allowedip',
            # 'core_alloweddevice',
            # 'core_alloweddevice_history',
            # 'core_devicesettings',
            # 'core_extendeduservisit',
            # 'core_schedule'
        ]:
            club_id = row_data.get('club_id')
            if club_id and not check_foreign_key('core_club', 'id', club_id, new_db_path):
                errors.append(f"Skipping record in {table_name}: invalid club_id: {club_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

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

        for field, value in row_data.items():
            if isinstance(new_fields.get(field), DateTimeField) and value:
                if isinstance(value, str):
                    try:
                        value = parse(value)
                        row_data[field] = timezone.make_aware(value) if timezone.is_naive(value) else value
                    except ValueError as e:
                        errors.append(f"Error parsing date {field} in {table_name}: {value}, error: {e}")
                        migration_summary[table_name]['failed'] += 1
                        continue
                elif isinstance(value, datetime) and timezone.is_naive(value):
                    row_data[field] = timezone.make_aware(value)

        row_data.pop('row_index', None)
        if table_name == 'finance_income':
            row_data.pop('related_receipt_id', None)
        if table_name == 'invites_freeinvite' and row_data.get('subscription_id') is None:
            errors.append(f"Skipping record in {table_name}: missing subscription_id: {row_data}")
            migration_summary[table_name]['failed'] += 1
            continue

        try:
            obj = model(**row_data)
            batch.append(obj)
        except Exception as e:
            errors.append(f"Error creating object for {table_name}: {e}, data: {row_data}")
            migration_summary[table_name]['failed'] += 1
            continue

        if len(batch) >= 500:
            try:
                model.objects.bulk_create(batch)
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
                logger.info(f"Attempting to save records individually for {table_name}...")
                batch_errors = []
                for obj in batch:
                    try:
                        obj.save()
                        migration_summary[table_name]['success'] += 1
                        if table_name == 'subscriptions_subscriptiontype':
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
                        batch_errors.append(f"Error saving individual record for {table_name}: {e}, data: {dict(obj.__dict__)}")
                        migration_summary[table_name]['failed'] += 1
                if batch_errors:
                    errors.extend(batch_errors[:10])
                batch = []

    if batch:
        try:
            model.objects.bulk_create(batch)
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
            logger.info(f"Attempting to save final records individually for {table_name}...")
            batch_errors = []
            for obj in batch:
                try:
                    obj.save()
                    migration_summary[table_name]['success'] += 1
                    if table_name == 'subscriptions_subscriptiontype':
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
                    batch_errors.append(f"Error saving final individual record for {table_name}: {e}, data: {dict(obj.__dict__)}")
                    migration_summary[table_name]['failed'] += 1
            if batch_errors:
                errors.extend(batch_errors[:10])

    if errors:
        logger.info(f"Completed migration of {table_name} with {len(errors)} errors")
        for error in errors[:10]:
            logger.error(error)
        if table_name == 'subscriptions_subscription' and invalid_type_ids:
            logger.warning(f"Invalid type_ids found: {invalid_type_ids}")
    else:
        logger.info(f"Completed migration of {table_name} successfully")

def migrate_all_required_tables(old_db_path, new_db_path):
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
            # 'core_allowedip',
            # 'core_alloweddevice',
            # 'core_alloweddevice_history',
            # 'core_devicesettings',
            # 'core_extendeduservisit',
            # 'core_schedule'
        ]:
            models[m._meta.db_table] = m

    tables = [
        'core_club',
        'accounts_user',
        'members_member',
        'subscriptions_feature',
        'subscriptions_subscriptiontype',
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
        'finance_stockitem',
        'finance_expense',
        'finance_incomesource',
        'finance_income',
        'finance_stocktransaction',
        'invites_freeinvite',
        'tickets_tickettype',
        'tickets_ticket',
        # 'core_allowedip',
        # 'core_alloweddevice',
        # 'core_alloweddevice_history',
        # 'core_devicesettings',
        # 'core_extendeduservisit',
        # 'core_schedule'
    ]

    for table in tables:
        if not models.get(table):
            logger.warning(f"Model {table} not found")
            migration_summary[table] = {'total': 0, 'success': 0, 'failed': 0}
            continue

    core_club_defaults = {}
    accounts_user_defaults = {
        'accounts.User.phone_number': None,
        'accounts.User.card_number': None,
        'accounts.User.address': "",
        'accounts.User.notes': "",
        'accounts.User.club': None,
        'accounts.User.hourly_rate': 0.00,
        'accounts.User.expected_hours': 176.0,
    }
    members_member_defaults = {
        'members.Member.club': None,
        'members.Member.referred_by': None,
    }
    feature_defaults = {
        'subscriptions.Feature.is_active': True,
    }
    subscriptiontype_defaults = {
        'subscriptions.SubscriptionType.is_private_training': False,
        'subscriptions.SubscriptionType.max_freeze_days': 0,
        'subscriptions.SubscriptionType.max_entries': 0,
        'subscriptions.SubscriptionType.is_active': True,
        'subscriptions.SubscriptionType.free_invites_allowed': 1,
        'subscriptions.SubscriptionType.is_golden_only': False,
    }
    paymentmethod_defaults = {
        'subscriptions.PaymentMethod.is_active': True,
    }
    subscription_defaults = {
        'subscriptions.Subscription.coach': None,
        'subscriptions.Subscription.created_by': None,
        'subscriptions.Subscription.remaining_amount': 0,
        'subscriptions.Subscription.coach_compensation_type': 'from_subscription',
        'subscriptions.Subscription.coach_compensation_value': 0.00,
        'subscriptions.Subscription.is_cancelled': False,
        'subscriptions.Subscription.refund_amount': 0.00,
        'subscriptions.Subscription.paid_amount': 0.00,
        'subscriptions.Subscription.entry_count': 0,
    }
    payment_defaults = {
        'subscriptions.Payment.transaction_id': None,
        'subscriptions.Payment.notes': "",
    }
    freezerequest_defaults = {
        'subscriptions.FreezeRequest.is_active': True,
        'subscriptions.FreezeRequest.cancelled_at': None,
    }
    coachprofile_defaults = {
        'subscriptions.CoachProfile.max_trainees': 0,
    }
    specialoffer_defaults = {
        'subscriptions.SpecialOffer.is_active': True,
        'subscriptions.SpecialOffer.is_golden': False,
    }
    attendance_defaults = {
        'attendance.Attendance.approved_by': None,
    }
    entrylog_defaults = {
        'attendance.EntryLog.approved_by': None,
    }
    shift_defaults = {
        'staff.Shift.approved_by': None,
    }
    staffattendance_defaults = {
        'staff.StaffAttendance.created_by': None,
    }
    expensecategory_defaults = {
        'finance.ExpenseCategory.is_stock_related': False,
    }
    expense_defaults = {
        'finance.Expense.description': "",
        'finance.Expense.paid_by': None,
        'finance.Expense.attachment': None,
        'finance.Expense.stock_item': None,
        'finance.Expense.stock_quantity': None,
        'finance.Expense.related_employee': None,
    }
    incomesource_defaults = {
        'finance.IncomeSource.price': 0.00,
        'finance.IncomeSource.description': "",
        'finance.IncomeSource.stock_item': None,
    }
    income_defaults = {
        'finance.Income.received_by': None,
        'finance.Income.description': "",
        'finance.Income.stock_transaction': None,
    }
    stockitem_defaults = {
        'finance.StockItem.description': "",
        'finance.StockItem.initial_quantity': 0,
        'finance.StockItem.current_quantity': 0,
        'finance.StockItem.is_sellable': True,
    }
    stocktransaction_defaults = {
        'finance.StockTransaction.description': "",
        'finance.StockTransaction.related_expense': None,
        'finance.StockTransaction.related_income': None,
        'finance.StockTransaction.created_by': None,
    }
    freeinvite_defaults = {
        'invites.FreeInvite.invited_by': None,
        'invites.FreeInvite.created_by': None,
        'invites.FreeInvite.subscription': None,
        'invites.FreeInvite.subscription': 1 
    }
    tickettype_defaults = {
        'tickets.TicketType.description': "",
    }
    ticket_defaults = {
        'tickets.Ticket.serial_number': None,
    }
    # allowedip_defaults = {}
    # alloweddevice_defaults = {
    #     'core.AllowedDevice.device_name': None,
    #     'core.AllowedDevice.is_active': True,
    #     'core.AllowedDevice.last_seen': None,
    # }
    # alloweddevice_history_defaults = {
    #     'core.AllowedDevice.history_change_reason': None,
    # }
    # devicesettings_defaults = {
    #     'core.DeviceSettings.max_allowed_devices': 6,
    # }
    # extendeduservisit_defaults = {
    #     'core.ExtendedUserVisit.session_duration': None,
    # }
    # schedule_defaults = {
    #     'core.Schedule.created_by': None,
    # }

    logger.info("Validating type_ids in old subscriptions_subscription...")
    type_ids_old = set()
    try:
        with get_db_connection(old_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT type_id FROM subscriptions_subscription")
            type_ids_old = {row[0] for row in cursor.fetchall() if row[0] is not None}
            logger.info(f"Type_ids found in old subscriptions_subscription: {type_ids_old}")
            cursor.execute("SELECT id FROM subscriptions_subscriptiontype")
            valid_type_ids_old = {row[0] for row in cursor.fetchall()}
            logger.info(f"Valid type_ids in old subscriptions_subscriptiontype: {valid_type_ids_old}")
            invalid_type_ids_old = type_ids_old - valid_type_ids_old
            if invalid_type_ids_old:
                logger.warning(f"Invalid type_ids in old subscriptions_subscription: {invalid_type_ids_old}")
    except sqlite3.OperationalError as e:
        logger.error(f"Error validating type_ids in old database: {e}")

    migrate_table(models['core_club'], 'core_club', old_db_path, new_db_path, migration_summary, core_club_defaults)
    migrate_table(models['accounts_user'], 'accounts_user', old_db_path, new_db_path, migration_summary, accounts_user_defaults)
    migrate_table(models['members_member'], 'members_member', old_db_path, new_db_path, migration_summary, members_member_defaults)
    migrate_table(models['subscriptions_feature'], 'subscriptions_feature', old_db_path, new_db_path, migration_summary, feature_defaults)
    migrate_table(models['subscriptions_subscriptiontype'], 'subscriptions_subscriptiontype', old_db_path, new_db_path, migration_summary, subscriptiontype_defaults)
    migrate_table(models['subscriptions_paymentmethod'], 'subscriptions_paymentmethod', old_db_path, new_db_path, migration_summary, paymentmethod_defaults)
    migrate_table(models['subscriptions_subscription'], 'subscriptions_subscription', old_db_path, new_db_path, migration_summary, subscription_defaults)
    migrate_table(models['subscriptions_payment'], 'subscriptions_payment', old_db_path, new_db_path, migration_summary, payment_defaults)
    migrate_table(models['subscriptions_freezerequest'], 'subscriptions_freezerequest', old_db_path, new_db_path, migration_summary, freezerequest_defaults)
    migrate_table(models['subscriptions_coachprofile'], 'subscriptions_coachprofile', old_db_path, new_db_path, migration_summary, coachprofile_defaults)
    migrate_table(models['subscriptions_specialoffer'], 'subscriptions_specialoffer', old_db_path, new_db_path, migration_summary, specialoffer_defaults)
    migrate_table(models['attendance_attendance'], 'attendance_attendance', old_db_path, new_db_path, migration_summary, attendance_defaults)
    migrate_table(models['attendance_entrylog'], 'attendance_entrylog', old_db_path, new_db_path, migration_summary, entrylog_defaults)
    migrate_table(models['staff_shift'], 'staff_shift', old_db_path, new_db_path, migration_summary, shift_defaults)
    migrate_table(models['staff_staffattendance'], 'staff_staffattendance', old_db_path, new_db_path, migration_summary, staffattendance_defaults)
    migrate_table(models['finance_expensecategory'], 'finance_expensecategory', old_db_path, new_db_path, migration_summary, expensecategory_defaults)
    migrate_table(models['finance_stockitem'], 'finance_stockitem', old_db_path, new_db_path, migration_summary, stockitem_defaults)
    migrate_table(models['finance_expense'], 'finance_expense', old_db_path, new_db_path, migration_summary, expense_defaults)
    migrate_table(models['finance_incomesource'], 'finance_incomesource', old_db_path, new_db_path, migration_summary, incomesource_defaults)
    migrate_table(models['finance_income'], 'finance_income', old_db_path, new_db_path, migration_summary, income_defaults)
    migrate_table(models['finance_stocktransaction'], 'finance_stocktransaction', old_db_path, new_db_path, migration_summary, stocktransaction_defaults)
    migrate_table(models['invites_freeinvite'], 'invites_freeinvite', old_db_path, new_db_path, migration_summary, freeinvite_defaults)
    migrate_table(models['tickets_tickettype'], 'tickets_tickettype', old_db_path, new_db_path, migration_summary, tickettype_defaults)
    migrate_table(models['tickets_ticket'], 'tickets_ticket', old_db_path, new_db_path, migration_summary, ticket_defaults)
    # migrate_table(models['core_allowedip'], 'core_allowedip', old_db_path, new_db_path, migration_summary, allowedip_defaults)
    # migrate_table(models['core_alloweddevice'], 'core_alloweddevice', old_db_path, new_db_path, migration_summary, alloweddevice_defaults)
    # migrate_table(models['core_alloweddevice_history'], 'core_alloweddevice_history', old_db_path, new_db_path, migration_summary, alloweddevice_history_defaults)
    # migrate_table(models['core_devicesettings'], 'core_devicesettings', old_db_path, new_db_path, migration_summary, devicesettings_defaults)
    # migrate_table(models['core_extendeduservisit'], 'core_extendeduservisit', old_db_path, new_db_path, migration_summary, extendeduservisit_defaults)
    # migrate_table(models['core_schedule'], 'core_schedule', old_db_path, new_db_path, migration_summary, schedule_defaults)

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
    OLD_DB_PATH = r"F:\club\gym\src\db_old.sqlite3"
    NEW_DB_PATH = r"F:\club\gym\src\db.sqlite3"
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
    import django
    django.setup()
    migration_summary, errors = migrate_all_required_tables(OLD_DB_PATH, NEW_DB_PATH)
    print_summary(migration_summary)
    print_detailed_errors(migration_summary, errors)