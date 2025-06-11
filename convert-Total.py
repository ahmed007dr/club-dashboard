import sqlite3
import os
from django.conf import settings
from django.apps import apps
from django.core.management import call_command
from django.db import models, connection
from django.utils import timezone
from datetime import datetime
from django.db.models import DateTimeField, BooleanField, CharField, TextField, IntegerField, FloatField, DecimalField, DateField, TimeField


def get_table_data(db_path, table_name):
    """Retrieve all data from a specified table in the database."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM \"{table_name}\"")
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        conn.close()
        return columns, rows
    except sqlite3.OperationalError as e:
        print(f"ERROR IN TABLE  {table_name}: {e}")
        return [], []

def check_foreign_key(table, column, value, new_db_path):
    """Check if a foreign key value exists in the new database."""
    try:
        if value is None:
            return True
        conn = sqlite3.connect(new_db_path)
        cursor = conn.cursor()
        cursor.execute(f"SELECT COUNT(*) FROM \"{table}\" WHERE \"{column}\" = ?", (value,))
        count = cursor.fetchone()[0]
        conn.close()
        return count > 0
    except sqlite3.OperationalError as e:
        print(f"ERROR IN FK {table}.{column}: {e}")
        return False


def migrate_table(model, table_name, old_db_path, new_db_path, migration_summary, default_values=None):
    """Migrate data for a single table with error handling and foreign key validation."""
    if default_values is None:
        default_values = {}

    model_name = f"{model._meta.app_label}.{model._meta.model_name}"
    old_columns, rows = get_table_data(old_db_path, table_name)
    if not rows:
        print(f"TABLE  {table_name} SOL ")
        migration_summary[table_name] = {'total': 0, 'success': 0, 'failed': 0}
        return

    print(f"Migrations table {table_name} ({len(rows)} سجلات)...")
    migration_summary[table_name] = {'total': len(rows), 'success': 0, 'failed': 0}

    new_fields = {field.name: field for field in model._meta.fields}
    new_field_names = set(new_fields.keys())
    old_field_names = set(old_columns)
    missing_fields = new_field_names - old_field_names
    print(f"الحقول الناقصة في {table_name}: {missing_fields}")

    # Special handling for tickets_ticket
    if table_name == 'tickets_ticket':
        create_default_ticket_types(models['tickets_tickettype'], new_db_path)

    batch = []
    errors = []
    for row_index, row in enumerate(rows):
        row_data = dict(zip(old_columns, row))
        row_data['row_index'] = row_index

        # Validate foreign keys
        if table_name in [
            'accounts_user',
            'members_member',
            'subscriptions_subscriptiontype',
            'subscriptions_subscription',
            'subscriptions_coachprofile',
            'attendance_attendance',
            'attendance_entrylog',
            'staff_shift',
            'staff_staffattendance',
            'finance_expense',
            'finance_income',
            'invites_freeinvite',
            'receipts_receipt',
            'tickets_tickettype',
            'tickets_ticket'
        ]:
            club_id = row_data.get('club_id')
            if club_id and not check_foreign_key('core_club', 'id', club_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: club_id غير صالح: {club_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'subscriptions_subscription':
            member_id = row_data.get('member_id')
            if member_id and not check_foreign_key('members_member', 'id', member_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: member_id غير صالح: {member_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            type_id = row_data.get('type_id')
            if type_id and not check_foreign_key('subscriptions_subscriptiontype', 'id', type_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: type_id غير صالح: {type_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            coach_id = row_data.get('coach_id')
            if coach_id and not check_foreign_key('accounts_user', 'id', coach_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: coach_id غير صالح: {coach_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            created_by_id = row_data.get('created_by_id')
            if created_by_id and not check_foreign_key('accounts_user', 'id', created_by_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: created_by_id غير صالح: {created_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'subscriptions_freezerequest':
            subscription_id = row_data.get('subscription_id')
            if subscription_id and not check_foreign_key('subscriptions_subscription', 'id', subscription_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: subscription_id غير صالح: {subscription_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            approved_by_id = row_data.get('approved_by_id')
            if approved_by_id and not check_foreign_key('accounts_user', 'id', approved_by_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: approved_by_id غير صالح: {approved_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'subscriptions_coachprofile':
            user_id = row_data.get('user_id')
            if user_id and not check_foreign_key('accounts_user', 'id', user_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: user_id غير صالح: {user_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'attendance_attendance':
            subscription_id = row_data.get('subscription_id')
            if subscription_id and not check_foreign_key('subscriptions_subscription', 'id', subscription_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: subscription_id غير صالح: {subscription_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            approved_by_id = row_data.get('approved_by_id')
            if approved_by_id and not check_foreign_key('accounts_user', 'id', approved_by_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: approved_by_id غير صالح: {approved_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'attendance_entrylog':
            user_id = row_data.get('user_id')
            if user_id and not check_foreign_key('accounts_user', 'id', user_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: user_id غير صالح: {user_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            staff_id = row_data.get('staff_id')
            if staff_id and not check_foreign_key('accounts_user', 'id', staff_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: staff_id غير صالح: {staff_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'staff_shift':
            staff_id = row_data.get('staff_id')
            if staff_id and not check_foreign_key('accounts_user', 'id', staff_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: staff_id غير صالح: {staff_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'staff_staffattendance':
            staff_id = row_data.get('staff_id')
            if staff_id and not check_foreign_key('accounts_user', 'id', staff_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: staff_id غير صالح: {staff_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'finance_expense':
            category_id = row_data.get('category_id')
            if category_id and not check_foreign_key('finance_expensecategory', 'id', category_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: category_id غير صالح: {category_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            user_id = row_data.get('user_id')
            if user_id and not check_foreign_key('accounts_user', 'id', user_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: user_id غير صالح: {user_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'finance_income':
            source_id = row_data.get('source_id')
            if source_id and not check_foreign_key('finance_incomesource', 'id', source_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: source_id غير صالح: {source_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            user_id = row_data.get('user_id')
            if user_id and not check_foreign_key('accounts_user', 'id', user_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: user_id غير صالح: {user_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

            related_receipt_id = row_data.get('related_receipt_id')
            if related_receipt_id and not check_foreign_key('receipts_receipt', 'id', related_receipt_id, new_db_path):
                row_data['related_receipt_id'] = None

        if table_name == 'receipts_receipt':
            user_id = row_data.get('user_id')
            if user_id and not check_foreign_key('accounts_user', 'id', user_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: user_id غير صالح: {user_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'tickets_ticket':
            ticket_type_id = row_data.get('ticket_type_id')
            if ticket_type_id and not check_foreign_key('tickets_tickettype', 'id', ticket_type_id, new_db_path):
                # Map string ticket_type to TicketType instance
                ticket_type_name = row_data.get('ticket_type')
                if ticket_type_name:
                    try:
                        ticket_type = models['tickets_tickettype'].objects.get(name=ticket_type_name)
                        row_data['ticket_type'] = ticket_type
                    except models['tickets_tickettype'].DoesNotExist:
                        errors.append(f"تخطي سجل في {table_name}: ticket_type غير صالح: {ticket_type_name}, data: {row_data}")
                        migration_summary[table_name]['failed'] += 1
                        continue
                else:
                    errors.append(f"تخطي سجل في {table_name}: ticket_type_id غير صالح: {ticket_type_id}, data: {row_data}")
                    migration_summary[table_name]['failed'] += 1
                    continue

            issued_by_id = row_data.get('issued_by_id')
            if issued_by_id and not check_foreign_key('accounts_user', 'id', issued_by_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: issued_by_id غير صالح: {issued_by_id}, data: {row_data}")
                migration_summary[table_name]['failed'] += 1
                continue

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
                        value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S.%f')
                    except ValueError:
                        try:
                            value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
                        except ValueError:
                            errors.append(f"error in date {field} في {table_name}: {value}, data: {row_data}")
                            migration_summary[table_name]['failed'] += 1
                            continue
                    row_data[field] = timezone.make_aware(value)
                elif isinstance(value, datetime) and timezone.is_naive(value):
                    row_data[field] = timezone.make_aware(value)

        # Remove row_index before creating object
        row_data.pop('row_index', None)

        try:
            obj = model(**row_data)
            batch.append(obj)
        except Exception as e:
            errors.append(f"خطأ في إنشاء كائن لـ {table_name}: {e}, data: {row_data}")
            migration_summary[table_name]['failed'] += 1
            continue

        # Process in smaller batches to avoid memory issues
        if len(batch) >= 1000:
            try:
                model.objects.bulk_create(batch)
                migration_summary[table_name]['success'] += len(batch)
                batch = []
            except Exception as e:
                errors.append(f"error in save {table_name}: {e}, data: {[str(dict(obj.__dict__)) for obj in batch[:5]]}")
                migration_summary[table_name]['failed'] += len(batch)
                print(f"محاولة حفظ السجلات واحدًا واحدًا لـ {table_name}...")
                batch_errors = []
                for obj in batch:
                    try:
                        obj.save()
                        migration_summary[table_name]['success'] += 1
                    except Exception as e:
                        batch_errors.append(f"error in save {table_name}: {e}, data: {dict(obj.__dict__)}")
                        migration_summary[table_name]['failed'] += 1
                if batch_errors:
                    errors.extend(batch_errors[:10])
                batch = []

    # Process remaining batch
    if batch:
        try:
            model.objects.bulk_create(batch)
            migration_summary[table_name]['success'] += len(batch)
        except Exception as e:
            errors.append(f"error in save {table_name}: {e}, data: {[str(dict(obj.__dict__)) for obj in batch[:5]]}")
            migration_summary[table_name]['failed'] = len(batch)
            print(f"محاولة حفظ السجلات واحدًا واحدًا لـ {table_name}...")
            batch_errors = []
            migration_summary[table_name]['success'] = 0
            migration_summary[table_name]['failed'] = 0
            for obj in batch:
                try:
                    obj.save()
                    migration_summary[table_name]['success'] += 1
                except Exception as e:
                    batch_errors.append(f"error in save {table_name}: {e}, data: {dict(obj.__dict__)}")
                    migration_summary[table_name]['failed'] += 1
            if batch_errors:
                errors.extend(batch_errors[:10])

    if errors:
        print(f"Done Migrations table {table_name} with {len(errors)} error :")
        for error in errors[:10]:
            print(error)
    else:
        print(f"Done Migrations table {table_name} بنجاح")

def migrate_all_required_tables(old_db_path, new_db_path):
    """Migrate data for all required tables, excluding django_content_type, auth_permission, auth_group, and devices-related tables."""
    # Set the new database path
    settings.DATABASES['default']['NAME'] = new_db_path
    print("flush database...")
    call_command('flush', interactive=False)
    print("apply mig...")
    try:
        call_command('migrate')
    except Exception as e:
        print(f"error in migration: {e}")
        return

    # Verify database schema
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"table in new : {tables}")

    migration_summary = {}
    global models
    models = {}
    for m in apps.get_models():
        if m._meta.db_table in [
            'core_club',
            'accounts_user',
            'members_member',
            'subscriptions_subscriptiontype',
            'subscriptions_subscription',
            'attendance_attendance',
            'attendance_entrylog',
            'staff_shift',
            'staff_staffattendance',
            'finance_expensecategory',
            'finance_expense',
            'finance_incomesource',
            'finance_income',
            'invites_freeinvite',
            'receipts_autocorrectionlog',
            'receipts_receipt',
        ]:
            models[m._meta.db_table] = m

    for table in [
        'core_club',
        'accounts_user',
        'members_member',
        'subscriptions_subscriptiontype',
        'subscriptions_subscription',
        'attendance_attendance',
        'attendance_entrylog',
        'staff_shift',
        'staff_staffattendance',
        'finance_expensecategory',
        'finance_expense',
        'finance_incomesource',
        'finance_income',
        'invites_freeinvite',
        'receipts_autocorrectionlog',
        'receipts_receipt',
    ]:
        if not models.get(table):
            print(f"dont found {table} here ")
            migration_summary[table] = {'total': 0, 'success': 0, 'failed': 0}
            continue

    # Default values for accounts_user
    accounts_user_defaults = {
        'accounts.User.phone_number': None,
        'accounts.User.card_number': None,
        'accounts.User.address': "",
        'accounts.User.notes': "",
        'accounts.User.club': None,
    }

    # Default values for members_member
    members_member_defaults = {
        'members.Member.club': None,
        'members.Member.referred_by': None,
    }

    # Default values for subscriptions_subscriptiontype
    subscriptiontype_defaults = {
        'subscriptions.SubscriptionType.is_private_training': False,
        'subscriptions.SubscriptionType.max_freeze_days': 0,
    }

    # Default values for subscriptions_subscription
    subscription_defaults = {
        'subscriptions.Subscription.coach': None,
        'subscriptions.Subscription.private_training_price': 0,
        'subscriptions.Subscription.created_by': None,
        'subscriptions.Subscription.remaining_amount': 0,
    }

    # Default values for attendance_attendance
    attendance_defaults = {
        'attendance.Attendance.approved_by': None,
    }

    # Default values for attendance_entrylog
    entrylog_defaults = {}

    # Default values for staff_shift
    shift_defaults = {}

    # Default values for staff_staffattendance
    staffattendance_defaults = {}

    # Default values for finance_incomesource
    incomesource_defaults = {
        'finance.IncomeSource.price': 0.00,
    }

    # Default values for finance_expense
    expense_defaults = {}

    # Default values for finance_income
    income_defaults = {
        'finance.Income.user': None,
        'finance.Income.description': "",
        'finance.Income.related_receipt': None,
    }

    # Default values for invites_freeinvite
    freeinvite_defaults = {}

    # Default values for receipts_autocorrectionlog
    autocorrectionlog_defaults = {}

    # Default values for receipts_receipt
    receipt_defaults = {}


    # Migrate tables in order
    migrate_table(models['core_club'], 'core_club', old_db_path, new_db_path, migration_summary)
    migrate_table(models['accounts_user'], 'accounts_user', old_db_path, new_db_path, migration_summary, accounts_user_defaults)
    migrate_table(models['members_member'], 'members_member', old_db_path, new_db_path, migration_summary, members_member_defaults)
    migrate_table(models['subscriptions_subscriptiontype'], 'subscriptions_subscriptiontype', old_db_path, new_db_path, migration_summary, subscriptiontype_defaults)
    migrate_table(models['subscriptions_subscription'], 'subscriptions_subscription', old_db_path, new_db_path, migration_summary, subscription_defaults)
    migrate_table(models['attendance_attendance'], 'attendance_attendance', old_db_path, new_db_path, migration_summary, attendance_defaults)
    migrate_table(models['attendance_entrylog'], 'attendance_entrylog', old_db_path, new_db_path, migration_summary, entrylog_defaults)
    migrate_table(models['staff_shift'], 'staff_shift', old_db_path, new_db_path, migration_summary, shift_defaults)
    migrate_table(models['staff_staffattendance'], 'staff_staffattendance', old_db_path, new_db_path, migration_summary, staffattendance_defaults)
    migrate_table(models['finance_expensecategory'], 'finance_expensecategory', old_db_path, new_db_path, migration_summary)
    migrate_table(models['finance_expense'], 'finance_expense', old_db_path, new_db_path, migration_summary, expense_defaults)
    migrate_table(models['finance_incomesource'], 'finance_incomesource', old_db_path, new_db_path, migration_summary, incomesource_defaults)
    migrate_table(models['finance_income'], 'finance_income', old_db_path, new_db_path, migration_summary, income_defaults)
    migrate_table(models['invites_freeinvite'], 'invites_freeinvite', old_db_path, new_db_path, migration_summary, freeinvite_defaults)
    migrate_table(models['receipts_autocorrectionlog'], 'receipts_autocorrectionlog', old_db_path, new_db_path, migration_summary, autocorrectionlog_defaults)
    migrate_table(models['receipts_receipt'], 'receipts_receipt', old_db_path, new_db_path, migration_summary, receipt_defaults)

    print_summary(migration_summary)

def print_summary(migration_summary):
    """Print migration summary."""
    print("\n=== summy ===")
    print(f"{'الجدول':<30} {'total':>10} {'win':>10} {'lose':>10}")
    print("-" * 62)
    for table, stats in migration_summary.items():
        print(f"{table:<30} {stats['total']:>10} {stats['success']:>10} {stats['failed']:>10}")
    print("========================")

if __name__ == "__main__":
    OLD_DB_PATH = r"F:\club\gym\src\db_old.sqlite3"
    NEW_DB_PATH = r"F:\club\gym\src\db.sqlite3"
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
    import django
    django.setup()
    migrate_all_required_tables(OLD_DB_PATH, NEW_DB_PATH)