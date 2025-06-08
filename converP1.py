import sqlite3
import os
from django.conf import settings
from django.apps import apps
from django.core.management import call_command
from django.db import models, connection
from django.utils import timezone
from datetime import datetime

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
        print(f"خطأ في جلب بيانات الجدول {table_name}: {e}")
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
        print(f"خطأ في التحقق من المفتاح الخارجي {table}.{column}: {e}")
        return False

def migrate_table(model, table_name, old_db_path, new_db_path, migration_summary, default_values=None):
    """Migrate data for a single table with error handling and foreign key validation."""
    if default_values is None:
        default_values = {}

    model_name = f"{model._meta.app_label}.{model._meta.model_name}"
    old_columns, rows = get_table_data(old_db_path, table_name)
    if not rows:
        print(f"الجدول {table_name} فارغ")
        migration_summary[table_name] = {'total': 0, 'success': 0, 'failed': 0}
        return

    print(f"تهجير الجدول {table_name} ({len(rows)} سجلات)...")
    migration_summary[table_name] = {'total': len(rows), 'success': 0, 'failed': 0}

    new_fields = {field.name: field for field in model._meta.fields}
    new_field_names = set(new_fields.keys())
    old_field_names = set(old_columns)
    missing_fields = new_field_names - old_field_names
    print(f"الحقول الناقصة في {table_name}: {missing_fields}")

    batch = []
    errors = []
    for row_index, row in enumerate(rows):
        row_data = dict(zip(old_columns, row))

        # Validate foreign keys
        if table_name in ['accounts_user', 'members_member', 'subscriptions_subscriptiontype', 'subscriptions_subscription', 'subscriptions_coachprofile', 'attendance_attendance', 'attendance_entrylog', 'staff_shift', 'staff_staffattendance']:
            club_id = row_data.get('club_id')
            if club_id and not check_foreign_key('core_club', 'id', club_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: club_id غير صالح: {club_id}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'subscriptions_subscription':
            member_id = row_data.get('member_id')
            if member_id and not check_foreign_key('members_member', 'id', member_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: member_id غير صالح: {member_id}")
                migration_summary[table_name]['failed'] += 1
                continue

            type_id = row_data.get('type_id')
            if type_id and not check_foreign_key('subscriptions_subscriptiontype', 'id', type_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: type_id غير صالح: {type_id}")
                migration_summary[table_name]['failed'] += 1
                continue

            coach_id = row_data.get('coach_id')
            if coach_id and not check_foreign_key('accounts_user', 'id', coach_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: coach_id غير صالح: {coach_id}")
                migration_summary[table_name]['failed'] += 1
                continue

            created_by_id = row_data.get('created_by_id')
            if created_by_id and not check_foreign_key('accounts_user', 'id', created_by_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: created_by_id غير صالح: {created_by_id}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'subscriptions_freezerequest':
            subscription_id = row_data.get('subscription_id')
            if subscription_id and not check_foreign_key('subscriptions_subscription', 'id', subscription_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: subscription_id غير صالح: {subscription_id}")
                migration_summary[table_name]['failed'] += 1
                continue

            approved_by_id = row_data.get('approved_by_id')
            if approved_by_id and not check_foreign_key('accounts_user', 'id', approved_by_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: approved_by_id غير صالح: {approved_by_id}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'subscriptions_coachprofile':
            user_id = row_data.get('user_id')
            if user_id and not check_foreign_key('accounts_user', 'id', user_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: user_id غير صالح: {user_id}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'attendance_attendance':
            subscription_id = row_data.get('subscription_id')
            if subscription_id and not check_foreign_key('subscriptions_subscription', 'id', subscription_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: subscription_id غير صالح: {subscription_id}")
                migration_summary[table_name]['failed'] += 1
                continue

            approved_by_id = row_data.get('approved_by_id')
            if approved_by_id and not check_foreign_key('accounts_user', 'id', approved_by_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: approved_by_id غير صالح: {approved_by_id}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'attendance_entrylog':
            user_id = row_data.get('user_id')
            if user_id and not check_foreign_key('accounts_user', 'id', user_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: user_id غير صالح: {user_id}")
                migration_summary[table_name]['failed'] += 1
                continue

            staff_id = row_data.get('staff_id')
            if staff_id and not check_foreign_key('accounts_user', 'id', staff_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: staff_id غير صالح: {staff_id}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'staff_shift':
            staff_id = row_data.get('staff_id')
            if staff_id and not check_foreign_key('accounts_user', 'id', staff_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: staff_id غير صالح: {staff_id}")
                migration_summary[table_name]['failed'] += 1
                continue

        if table_name == 'staff_staffattendance':
            staff_id = row_data.get('staff_id')
            if staff_id and not check_foreign_key('accounts_user', 'id', staff_id, new_db_path):
                errors.append(f"تخطي سجل في {table_name}: staff_id غير صالح: {staff_id}")
                migration_summary[table_name]['failed'] += 1
                continue

        # Handle missing fields
        for field in missing_fields:
            default_key = f"{model_name}.{field}"
            if default_key in default_values:
                row_data[field] = default_values[default_key]
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

        # Handle datetime fields
        for field, value in row_data.items():
            if isinstance(new_fields.get(field), models.DateTimeField) and value:
                if isinstance(value, str):
                    try:
                        value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S.%f')
                    except ValueError:
                        try:
                            value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
                        except ValueError:
                            errors.append(f"تنسيق تاريخ غير صحيح للحقل {field} في {table_name}: {value}")
                            migration_summary[table_name]['failed'] += 1
                            continue
                    row_data[field] = timezone.make_aware(value)
                elif isinstance(value, datetime) and timezone.is_naive(value):
                    row_data[field] = timezone.make_aware(value)

        try:
            obj = model(**row_data)
            batch.append(obj)
        except Exception as e:
            errors.append(f"خطأ في إنشاء كائن لـ {table_name}: {e}, البيانات: {row_data}")
            migration_summary[table_name]['failed'] += 1
            continue

        # Process in smaller batches to avoid memory issues
        if len(batch) >= 1000:
            try:
                model.objects.bulk_create(batch)
                migration_summary[table_name]['success'] += len(batch)
                batch = []
            except Exception as e:
                errors.append(f"خطأ في تهجير دفعة لـ {table_name}: {e}, البيانات: {[str(dict(obj.__dict__)) for obj in batch[:5]]}")
                migration_summary[table_name]['failed'] += len(batch)
                print(f"محاولة حفظ السجلات واحدًا واحدًا لـ {table_name}...")
                batch_errors = []
                for obj in batch:
                    try:
                        obj.save()
                        migration_summary[table_name]['success'] += 1
                    except Exception as e:
                        batch_errors.append(f"خطأ في حفظ سجل لـ {table_name}: {e}, البيانات: {dict(obj.__dict__)}")
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
            errors.append(f"خطأ في تهجير دفعة لـ {table_name}: {e}, البيانات: {[str(dict(obj.__dict__)) for obj in batch[:5]]}")
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
                    batch_errors.append(f"خطأ في حفظ سجل لـ {table_name}: {e}, البيانات: {dict(obj.__dict__)}")
                    migration_summary[table_name]['failed'] += 1
            if batch_errors:
                errors.extend(batch_errors[:10])

    if errors:
        print(f"تم تهجير الجدول {table_name} مع {len(errors)} أخطاء:")
        for error in errors[:10]:
            print(error)
    else:
        print(f"تم تهجير الجدول {table_name} بنجاح")

def migrate_core_accounts_members_subtype_subscription_freeze_coach_attendance_staff(old_db_path, new_db_path):
    """Migrate data for core_club, accounts_user, members_member, subscriptions_subscriptiontype, subscriptions_subscription, subscriptions_freezerequest, subscriptions_coachprofile, attendance_attendance, attendance_entrylog, staff_shift, and staff_staffattendance tables."""
    # Set the new database path
    settings.DATABASES['default']['NAME'] = new_db_path
    print("تفريغ بيانات قاعدة البيانات الجديدة...")
    call_command('flush', interactive=False)
    print("تطبيق التهجيرات...")
    try:
        call_command('migrate')
    except Exception as e:
        print(f"خطأ في تطبيق التهجيرات: {e}")
        return

    # Verify database schema
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"الجداول في قاعدة البيانات الجديدة: {tables}")

    migration_summary = {}

    # Find models
    models = {}
    for m in apps.get_models():
        if m._meta.db_table in ['core_club', 'accounts_user', 'members_member', 'subscriptions_subscriptiontype', 'subscriptions_subscription', 'subscriptions_freezerequest', 'subscriptions_coachprofile', 'attendance_attendance', 'attendance_entrylog', 'staff_shift', 'staff_staffattendance']:
            models[m._meta.db_table] = m

    if not models.get('core_club'):
        print("لم يتم العثور على نموذج core_club في النماذج")
        return
    if not models.get('accounts_user'):
        print("لم يتم العثور على نموذج accounts_user في النماذج")
        return
    if not models.get('members_member'):
        print("لم يتم العثور على نموذج members_member في النماذج")
        return
    if not models.get('subscriptions_subscriptiontype'):
        print("لم يتم العثور على نموذج subscriptions_subscriptiontype في النماذج")
        return
    if not models.get('subscriptions_subscription'):
        print("لم يتم العثور على نموذج subscriptions_subscription في النماذج")
        return
    if not models.get('subscriptions_freezerequest'):
        print("لم يتم العثور على نموذج subscriptions_freezerequest في النماذج")
        return
    if not models.get('subscriptions_coachprofile'):
        print("لم يتم العثور على نموذج subscriptions_coachprofile في النماذج")
        return
    if not models.get('attendance_attendance'):
        print("لم يتم العثور على نموذج attendance_attendance في النماذج")
        return
    if not models.get('attendance_entrylog'):
        print("لم يتم العثور على نموذج attendance_entrylog في النماذج")
        return
    if not models.get('staff_shift'):
        print("لم يتم العثور على نموذج staff_shift في النماذج")
        return
    if not models.get('staff_staffattendance'):
        print("لم يتم العثور على نموذج staff_staffattendance في النماذج")
        return

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

    # Default values for subscriptions_freezerequest
    freezerequest_defaults = {
        'subscriptions.FreezeRequest.approved_by': None,
    }

    # Default values for subscriptions_coachprofile
    coachprofile_defaults = {
        'subscriptions.CoachProfile.bio': "",
        'subscriptions.CoachProfile.specialization': "",
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

    # Migrate tables in order
    migrate_table(models['core_club'], 'core_club', old_db_path, new_db_path, migration_summary)
    migrate_table(models['accounts_user'], 'accounts_user', old_db_path, new_db_path, migration_summary, accounts_user_defaults)
    migrate_table(models['members_member'], 'members_member', old_db_path, new_db_path, migration_summary, members_member_defaults)
    migrate_table(models['subscriptions_subscriptiontype'], 'subscriptions_subscriptiontype', old_db_path, new_db_path, migration_summary, subscriptiontype_defaults)
    migrate_table(models['subscriptions_subscription'], 'subscriptions_subscription', old_db_path, new_db_path, migration_summary, subscription_defaults)
    migrate_table(models['subscriptions_freezerequest'], 'subscriptions_freezerequest', old_db_path, new_db_path, migration_summary, freezerequest_defaults)
    migrate_table(models['subscriptions_coachprofile'], 'subscriptions_coachprofile', old_db_path, new_db_path, migration_summary, coachprofile_defaults)
    migrate_table(models['attendance_attendance'], 'attendance_attendance', old_db_path, new_db_path, migration_summary, attendance_defaults)
    migrate_table(models['attendance_entrylog'], 'attendance_entrylog', old_db_path, new_db_path, migration_summary, entrylog_defaults)
    migrate_table(models['staff_shift'], 'staff_shift', old_db_path, new_db_path, migration_summary, shift_defaults)
    migrate_table(models['staff_staffattendance'], 'staff_staffattendance', old_db_path, new_db_path, migration_summary, staffattendance_defaults)

    print_summary(migration_summary)

def print_summary(migration_summary):
    """Print migration summary."""
    print("\n=== ملخص التهجير ===")
    print(f"{'الجدول':<30} {'الإجمالي':>10} {'الناجح':>10} {'الفاشل':>10}")
    print("-" * 62)
    for table, stats in migration_summary.items():
        print(f"{table:<30} {stats['total']:>10} {stats['success']:>10} {stats['failed']:>10}")
    print("========================")

if __name__ == "__main__":
    OLD_DB_PATH = r"F:\club\club2\src\db_old.sqlite3"
    NEW_DB_PATH = r"F:\club\club2\src\db.sqlite3"
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
    import django
    django.setup()
    migrate_core_accounts_members_subtype_subscription_freeze_coach_attendance_staff(OLD_DB_PATH, NEW_DB_PATH)