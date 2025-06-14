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
        print(f"Fetched {len(rows)} rows from {table_name} with columns: {columns}")
        return columns, rows
    except sqlite3.OperationalError as e:
        print(f"Error accessing table {table_name}: {e}")
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
        if count == 0:
            print(f"Foreign key check failed: {table}.{column} = {value} not found")
        return count > 0
    except sqlite3.OperationalError as e:
        print(f"Error checking foreign key {table}.{column}: {e}")
        return False

def create_default_features(club_id, new_db_path):
    """Create default features if they don't exist."""
    try:
        conn = sqlite3.connect(new_db_path)
        cursor = conn.cursor()
        features = [
            ('Gym', club_id),
            ('Pool', club_id),
            ('Classes', club_id),
        ]
        cursor.executemany(
            "INSERT OR IGNORE INTO subscriptions_feature (name, club_id, is_active, created_at) VALUES (?, ?, 1, ?)",
            [(name, club_id, timezone.now()) for name, club_id in features]
        )
        conn.commit()
        print(f"Created default features for club_id {club_id}")
        conn.close()
    except sqlite3.OperationalError as e:
        print(f"Error creating default features: {e}")

def create_default_payment_methods(club_id, new_db_path):
    """Create default payment methods if they don't exist."""
    try:
        conn = sqlite3.connect(new_db_path)
        cursor = conn.cursor()
        methods = [
            ('Cash', club_id),
            ('Visa', club_id),
            ('Bank Transfer', club_id),
        ]
        cursor.executemany(
            "INSERT OR IGNORE INTO subscriptions_paymentmethod (name, club_id, is_active, created_at) VALUES (?, ?, 1, ?)",
            [(name, club_id, timezone.now()) for name, club_id in methods]
        )
        conn.commit()
        print(f"Created default payment methods for club_id {club_id}")
        conn.close()
    except sqlite3.OperationalError as e:
        print(f"Error creating default payment methods: {e}")

def migrate_table(model, table_name, old_db_path, new_db_path, migration_summary, default_values=None):
    """Migrate data for a single table with error handling and foreign key validation."""
    if default_values is None:
        default_values = {}

    model_name = f"{model._meta.app_label}.{model._meta.model_name}"
    old_columns, rows = get_table_data(old_db_path, table_name)
    if not rows:
        print(f"Table {table_name} is empty")
        migration_summary[table_name] = {'total': 0, 'success': 0, 'failed': 0}
        return

    print(f"Migrating table {table_name} ({len(rows)} records)...")
    migration_summary[table_name] = {'total': len(rows), 'success': 0, 'failed': 0}

    new_fields = {field.name: field for field in model._meta.fields}
    new_field_names = set(new_fields.keys())
    old_field_names = set(old_columns)
    missing_fields = new_field_names - old_field_names
    print(f"Missing fields in {table_name}: {missing_fields}")

    if table_name == 'core_club':
        for row in rows:
            club_id = row[old_columns.index('id')]
            create_default_features(club_id, new_db_path)
            create_default_payment_methods(club_id, new_db_path)

    batch = []
    errors = []
    feature_mappings = {}
    invalid_type_ids = set()

    # Validate type_ids in subscriptions_subscription before migration
    if table_name == 'subscriptions_subscription':
        valid_type_ids = set()
        try:
            conn = sqlite3.connect(new_db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM subscriptions_subscriptiontype")
            valid_type_ids = {row[0] for row in cursor.fetchall()}
            conn.close()
            print(f"Valid type_ids in new database: {valid_type_ids}")
        except sqlite3.OperationalError as e:
            print(f"Error fetching valid type_ids: {e}")

    for row_index, row in enumerate(rows):
        row_data = dict(zip(old_columns, row))
        row_data['row_index'] = row_index

        if table_name == 'subscriptions_subscriptiontype':
            for field in ['includes_gym', 'includes_pool', 'includes_classes']:
                row_data.pop(field, None)
            club_id = row_data.get('club_id')
            if club_id:
                try:
                    conn = sqlite3.connect(new_db_path)
                    cursor = conn.cursor()
                    cursor.execute("SELECT id, name FROM subscriptions_feature WHERE club_id = ?", (club_id,))
                    features = cursor.fetchall()
                    feature_mappings[club_id] = {name: fid for fid, name in features}
                    conn.close()
                except sqlite3.OperationalError as e:
                    errors.append(f"Error fetching features for club {club_id}: {e}")
                    migration_summary[table_name]['failed'] += 1
                    continue

        if table_name == 'subscriptions_subscription':
            # Remove private_training_price and map to coach_compensation_value if needed
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

        if table_name in [
            'core_club',
            'accounts_user',
            'members_member',
            'subscriptions_subscriptiontype',
            'subscriptions_feature',
            'subscriptions_paymentmethod',
            'subscriptions_subscription'
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
                        value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S.%f')
                    except ValueError:
                        try:
                            value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
                        except ValueError:
                            errors.append(f"Error parsing date {field} in {table_name}: {value}, data: {row_data}")
                            migration_summary[table_name]['failed'] += 1
                            continue
                    row_data[field] = timezone.make_aware(value)
                elif isinstance(value, datetime) and timezone.is_naive(value):
                    row_data[field] = timezone.make_aware(value)

        row_data.pop('row_index', None)

        try:
            obj = model(**row_data)
            batch.append(obj)
        except Exception as e:
            errors.append(f"Error creating object for {table_name}: {e}, data: {row_data}")
            migration_summary[table_name]['failed'] += 1
            continue

        if len(batch) >= 1000:
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
                print(f"Attempting to save records individually for {table_name}...")
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
            print(f"Attempting to save final records individually for {table_name}...")
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
        print(f"Completed migration of {table_name} with {len(errors)} errors:")
        for error in errors[:10]:
            print(error)
        if table_name == 'subscriptions_subscription' and invalid_type_ids:
            print(f"Invalid type_ids found: {invalid_type_ids}")
    else:
        print(f"Completed migration of {table_name} successfully")

def migrate_core_tables(old_db_path, new_db_path):
    """Migrate core tables including subscriptions_subscription."""
    settings.DATABASES['default']['NAME'] = new_db_path
    print("Flushing database...")
    call_command('flush', interactive=False)
    print("Applying migrations...")
    try:
        call_command('migrate')
    except Exception as e:
        print(f"Error applying migrations: {e}")
        return

    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Tables in new database: {tables}")

    migration_summary = {}
    global models
    models = {}
    for m in apps.get_models():
        if m._meta.db_table in [
            'core_club',
            'accounts_user',
            'members_member',
            'subscriptions_feature',
            'subscriptions_subscriptiontype',
            'subscriptions_paymentmethod',
            'subscriptions_subscription'
        ]:
            models[m._meta.db_table] = m

    tables = [
        'core_club',
        'accounts_user',
        'members_member',
        'subscriptions_feature',
        'subscriptions_subscriptiontype',
        'subscriptions_paymentmethod',
        'subscriptions_subscription'
    ]

    for table in tables:
        if not models.get(table):
            print(f"Model {table} not found")
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
        'accounts.User.expected_hours': 160.0,
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

    # Validate type_ids in old database
    print("Validating type_ids in old subscriptions_subscription...")
    type_ids_old = set()
    try:
        conn = sqlite3.connect(old_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT type_id FROM subscriptions_subscription")
        type_ids_old = {row[0] for row in cursor.fetchall() if row[0] is not None}
        print(f"Type_ids found in old subscriptions_subscription: {type_ids_old}")
        cursor.execute("SELECT id FROM subscriptions_subscriptiontype")
        valid_type_ids_old = {row[0] for row in cursor.fetchall()}
        print(f"Valid type_ids in old subscriptions_subscriptiontype: {valid_type_ids_old}")
        invalid_type_ids_old = type_ids_old - valid_type_ids_old
        if invalid_type_ids_old:
            print(f"Invalid type_ids in old subscriptions_subscription: {invalid_type_ids_old}")
        conn.close()
    except sqlite3.OperationalError as e:
        print(f"Error validating type_ids in old database: {e}")

    migrate_table(models['core_club'], 'core_club', old_db_path, new_db_path, migration_summary, core_club_defaults)
    migrate_table(models['accounts_user'], 'accounts_user', old_db_path, new_db_path, migration_summary, accounts_user_defaults)
    migrate_table(models['members_member'], 'members_member', old_db_path, new_db_path, migration_summary, members_member_defaults)
    migrate_table(models['subscriptions_feature'], 'subscriptions_feature', old_db_path, new_db_path, migration_summary, feature_defaults)
    migrate_table(models['subscriptions_subscriptiontype'], 'subscriptions_subscriptiontype', old_db_path, new_db_path, migration_summary, subscriptiontype_defaults)
    migrate_table(models['subscriptions_paymentmethod'], 'subscriptions_paymentmethod', old_db_path, new_db_path, migration_summary, paymentmethod_defaults)
    migrate_table(models['subscriptions_subscription'], 'subscriptions_subscription', old_db_path, new_db_path, migration_summary, subscription_defaults)

    print("Listing migrated subscription types in new database...")
    try:
        conn = sqlite3.connect(new_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM subscriptions_subscriptiontype")
        types = cursor.fetchall()
        print(f"Migrated subscription types: {types}")
        conn.close()
    except sqlite3.OperationalError as e:
        print(f"Error listing subscription types: {e}")

    return migration_summary

def print_summary(migration_summary):
    """Print migration summary."""
    print("\n=== Migration Summary ===")
    print(f"{'Table':<30} {'Total':>10} {'Success':>10} {'Failed':>10}")
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
    migration_summary = migrate_core_tables(OLD_DB_PATH, NEW_DB_PATH)
    print_summary(migration_summary)