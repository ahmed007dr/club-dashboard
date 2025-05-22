import sqlite3
import os
from django.conf import settings
from django.apps import apps
from django.core.management import call_command
from django.db import models
from datetime import datetime, time
import uuid

def get_table_info(db_path, table_name):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [row[1] for row in cursor.fetchall()]
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        row_count = cursor.fetchone()[0]
        conn.close()
        return columns, row_count
    except sqlite3.OperationalError:
        return [], 0

def compare_databases(old_db_path, new_db_path):
    print("\n=== report compare ===")
    
    conn_old = sqlite3.connect(old_db_path)
    cursor_old = conn_old.cursor()
    cursor_old.execute("SELECT name FROM sqlite_master WHERE type='table';")
    old_tables = [row[0] for row in cursor_old.fetchall() if not row[0].startswith('sqlite_')]
    conn_old.close()

    for table in old_tables:
        old_columns, old_row_count = get_table_info(old_db_path, table)
        new_columns, new_row_count = get_table_info(new_db_path, table)
        print(f"\nجدول: {table}")
        print(f"count of record : {old_row_count}, new: {new_row_count}")
        print(f"old columns: {old_columns}")
        print(f"new columns: {new_columns}")
        missing_columns = set(new_columns) - set(old_columns)
        if missing_columns:
            print(f"الأعمدة الجديدة الناقصة: {missing_columns}")

def get_old_schema(old_db_path):
    """قراءة الـ schema من القاعدة القديمة."""
    try:
        conn = sqlite3.connect(old_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table';")
        tables = {row[0]: row[1] for row in cursor.fetchall() if not row[0].startswith('sqlite_')}
        conn.close()
        if not tables:
            print("alarm : no table here!")
        else:
            print("table in old", list(tables.keys()))
        return tables
    except sqlite3.OperationalError as e:
        print(f"error in old schema {e}")
        return {}

def get_table_data(old_db_path, table_name):
    try:
        conn = sqlite3.connect(old_db_path)
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {table_name}")
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        conn.close()
        return columns, rows
    except sqlite3.OperationalError:
        return [], []

def migrate_data(old_db_path, new_db_path, default_values):
    settings.DATABASES['default']['NAME'] = new_db_path

    call_command('migrate')

    old_tables = get_old_schema(old_db_path)

    default_values = default_values or {
        'attendance.Attendance.entry_time': time(0, 0), 
        'invites.FreeInvite.created_at': datetime(2025, 1, 1), 
        'accounts.User.role': 'reception',
        'subscriptions.SubscriptionType.is_active': True,
        'subscriptions.SubscriptionType.max_entries': 0,
        'subscriptions.Subscription.entry_count': 0,
        'subscriptions.Subscription.remaining_amount': 0,
        'attendance.EntryLog.approved_by': None,
        'attendance.EntryLog.related_subscription': None,
        'members.FreeInvite.status': 'pending',
        'receipts.Receipt.invoice_number': None,
        'staff.Shift.shift_end_date': None,
        'staff.Shift.approved_by': None,
        'finance.Expense.invoice_number': None,
        'finance.Expense.attachment': None,
        'finance.Income.related_receipt': None,
        'tickets.Ticket.used': False,
    }

    for model in apps.get_models():
        table_name = model._meta.db_table
        model_name = f"{model._meta.app_label}.{model._meta.model_name}"
        
        if table_name not in old_tables:
            print(f"table {table_name} not in old")
            continue

        old_columns, rows = get_table_data(old_db_path, table_name)
        if not rows:
            print(f"empty {table_name}")
            continue
        
        new_fields = {field.name: field for field in model._meta.fields}
        new_field_names = set(new_fields.keys())

        old_field_names = set(old_columns)

        missing_fields = new_field_names - old_field_names
        print(f"old {model_name}: {missing_fields}")

        for row in rows:
            row_data = dict(zip(old_columns, row))
            
            for field in missing_fields:
                default_key = f"{model_name}.{field}"
                if default_key in default_values:
                    row_data[field] = default_values[default_key]() if callable(default_values[default_key]) else default_values[default_key]
                elif new_fields[field].has_default():
                    row_data[field] = new_fields[field].get_default()
                else:
                    # قيم افتراضية عامة
                    if isinstance(new_fields[field], models.BooleanField):
                        row_data[field] = False
                    elif isinstance(new_fields[field], (models.CharField, models.TextField)):
                        row_data[field] = ""
                    elif isinstance(new_fields[field], (models.IntegerField, models.FloatField, models.DecimalField)):
                        row_data[field] = 0
                    elif isinstance(new_fields[field], models.DateTimeField):
                        row_data[field] = datetime.now()
                    elif isinstance(new_fields[field], models.DateField):
                        row_data[field] = datetime.now().date()
                    elif isinstance(new_fields[field], models.TimeField):
                        row_data[field] = time(0, 0)
                    else:
                        row_data[field] = None

    
            try:
                model.objects.create(**row_data)
            except Exception as e:
                print(f" error in{model_name}: {e}")
                continue

        print(f" {model_name} done")

    # مقارنة القاعدتين
    compare_databases(old_db_path, new_db_path)

if __name__ == "__main__":
    # مسارات قاعدتي البيانات
    OLD_DB_PATH = r"F:\club\clubx\src\db_old.sqlite3"  
    NEW_DB_PATH = r"F:\club\clubx\src\db.sqlite3"     

    # تشغيل السكربت
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings") 
    import django
    django.setup()
    from datetime import time
    migrate_data(OLD_DB_PATH, NEW_DB_PATH, None)