import sqlite3
import os
from django.conf import settings
from django.apps import apps
from django.core.management import call_command
from django.db import models
from datetime import datetime, time
from django.utils import timezone

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
        print(f"Error accessing table {table_name}: {e}")
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
        print(f"Error retrieving data from {table_name}: {e}")
        return [], []

def check_foreign_keys(table, row_data, new_db_path):
    """Check if foreign keys exist in the new database."""
    try:
        conn = sqlite3.connect(new_db_path)
        cursor = conn.cursor()
        if table == 'auth_group_permissions':
            group_id = row_data.get('group_id')
            permission_id = row_data.get('permission_id')
            cursor.execute("SELECT COUNT(*) FROM auth_group WHERE id = ?", (group_id,))
            if cursor.fetchone()[0] == 0:
                return False, f"Invalid group_id: {group_id}"
            cursor.execute("SELECT COUNT(*) FROM auth_permission WHERE id = ?", (permission_id,))
            if cursor.fetchone()[0] == 0:
                return False, f"Invalid permission_id: {permission_id}"
        elif table == 'accounts_user_groups':
            user_id = row_data.get('user_id')
            group_id = row_data.get('group_id')
            cursor.execute("SELECT COUNT(*) FROM accounts_user WHERE id = ?", (user_id,))
            if cursor.fetchone()[0] == 0:
                return False, f"Invalid user_id: {user_id}"
            cursor.execute("SELECT COUNT(*) FROM auth_group WHERE id = ?", (group_id,))
            if cursor.fetchone()[0] == 0:
                return False, f"Invalid group_id: {group_id}"
        elif table == 'staff_shift':
            approved_by_id = row_data.get('approved_by_id')
            club_id = row_data.get('club_id')
            if approved_by_id is not None:
                cursor.execute("SELECT COUNT(*) FROM accounts_user WHERE id = ?", (approved_by_id,))
                if cursor.fetchone()[0] == 0:
                    return False, f"Invalid approved_by_id: {approved_by_id}"
            cursor.execute("SELECT COUNT(*) FROM core_club WHERE id = ?", (club_id,))
            if cursor.fetchone()[0] == 0:
                return False, f"Invalid club_id: {club_id}"
        elif table == 'tickets_ticket':
            club_id = row_data.get('club_id')
            ticket_type_id = row_data.get('ticket_type_id')
            used_by_id = row_data.get('used_by_id')
            issued_by_id = row_data.get('issued_by_id')
            book_id = row_data.get('book_id')
            cursor.execute("SELECT COUNT(*) FROM core_club WHERE id = ?", (club_id,))
            if cursor.fetchone()[0] == 0:
                return False, f"Invalid club_id: {club_id}"
            if ticket_type_id:
                cursor.execute("SELECT COUNT(*) FROM tickets_tickettype WHERE id = ?", (ticket_type_id,))
                if cursor.fetchone()[0] == 0:
                    return False, f"Invalid ticket_type_id: {ticket_type_id}"
            if used_by_id:
                cursor.execute("SELECT COUNT(*) FROM members_member WHERE id = ?", (used_by_id,))
                if cursor.fetchone()[0] == 0:
                    return False, f"Invalid used_by_id: {used_by_id}"
            if issued_by_id:
                cursor.execute("SELECT COUNT(*) FROM accounts_user WHERE id = ?", (issued_by_id,))
                if cursor.fetchone()[0] == 0:
                    return False, f"Invalid issued_by_id: {issued_by_id}"
            if book_id:
                cursor.execute("SELECT COUNT(*) FROM tickets_ticketbook WHERE id = ?", (book_id,))
                if cursor.fetchone()[0] == 0:
                    return False, f"Invalid book_id: {book_id}"
        conn.close()
        return True, ""
    except sqlite3.OperationalError as e:
        return False, f"Error checking foreign keys: {e}"

def get_table_size(db_path, table_name):
    """Estimate the size of a table in bytes."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(f"SELECT COUNT(*) FROM \"{table_name}\"")
        row_count = cursor.fetchone()[0]
        size = 0
        if row_count > 0:
            cursor.execute(f"PRAGMA table_info(\"{table_name}\")")
            columns = [row[1] for row in cursor.fetchall()]
            query = f"SELECT " + ", ".join([f"LENGTH(\"{col}\")" for col in columns]) + f" FROM \"{table_name}\""
            cursor.execute(query)
            for row in cursor.fetchall():
                size += sum(l or 0 for l in row)
            cursor.execute(f"PRAGMA table_info(\"{table_name}\")")
            for col in cursor.fetchall():
                col_type = col[2].lower()
                if 'int' in col_type:
                    size += row_count * 4
                elif 'real' in col_type or 'float' in col_type:
                    size += row_count * 8
        conn.close()
        return size
    except sqlite3.OperationalError as e:
        print(f"Error estimating size for {table_name}: {e}")
        return 0

def validate_migration(old_db_path, new_db_path):
    """Validate the migration by comparing record counts and sizes."""
    print("\n=== Validating Migration ===")
    conn_old = sqlite3.connect(old_db_path)
    conn_new = sqlite3.connect(new_db_path)
    cursor_old = conn_old.cursor()
    cursor_new = conn_new.cursor()
    cursor_old.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor_old.fetchall() if not row[0].startswith('sqlite_') or row[0] == 'sqlite_sequence']
    errors = []
    total_old_size = 0
    total_new_size = 0
    print(f"{'Table':<30} {'Old Records':<12} {'New Records':<12} {'Old Size (bytes)':<16} {'New Size (bytes)':<16}")
    print("-" * 90)
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
        print(f"{table:<30} {old_count:<12} {new_count:<12} {old_size:<16} {new_size:<16}")
        if old_count != new_count:
            errors.append(f"Error in {table}: Old {old_count}, New {new_count}")
    conn_old.close()
    conn_new.close()
    print(f"\nTotal sizes (estimated):")
    print(f"Old database: {total_old_size} bytes (~{total_old_size / 1024 / 1024:.2f} MB)")
    print(f"New database: {total_new_size} bytes (~{total_new_size / 1024 / 1024:.2f} MB)")
    if errors:
        print(f"\nFound {len(errors)} errors:")
        for error in errors:
            print(error)
    else:
        print("\nAll tables migrated successfully!")

def migrate_data(old_db_path, new_db_path, default_values=None):
    """Migrate data from old database to new database."""
    settings.DATABASES['default']['NAME'] = new_db_path
    print("Clearing data from the new database...")
    call_command('flush', interactive=False)
    print("Applying migrations...")
    call_command('migrate')

    default_values = default_values or {
        'attendance.Attendance.entry_time': lambda: None,
        'invites.FreeInvite.created_at': lambda: datetime.now(),
        'accounts.User.role': 'reception',
        'subscriptions.SubscriptionType.is_active': True,
        'subscriptions.SubscriptionType.max_entries': 0,
        'subscriptions.Subscription.entry_count': 0,
        'subscriptions.Subscription.remaining_amount': 0,
        'subscriptions.Subscription.coach': None,
        'subscriptions.Subscription.private_training_price': 0,
        'subscriptions.Subscription.created_by': None,
        'subscriptions.SubscriptionType.is_private_training': False,
        'subscriptions.SubscriptionType.max_freeze_days': 0,
        'attendance.Attendance.attendance_date': lambda: datetime.now().date(),
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
        'tickets.Ticket.used_datetime': None,
        'tickets.Ticket.issued_by': None,
        'tickets.Ticket.book': None,
        'tickets.Ticket.serial_number': lambda: f"TBK-DEFAULT-{int(timezone.now().timestamp())}",
    }

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
        'attendance_attendance',
        'attendance_entrylog',
        'user_visit_uservisit',
        'devices_allowedip',
        'devices_devicesettings',
        'devices_extendeduservisit',
        'devices_alloweddevice',
        'devices_historicalalloweddevice',
        'receipts_autocorrectionlog',
        'receipts_receipt',
        'finance_expensecategory',
        'finance_expense',
        'finance_incomesource',
        'finance_income',
        'invites_freeinvite',
        'django_session',
        'staff_shift',
        'staff_staffattendance',
        'tickets_tickettype',
        'tickets_ticketbook',
        'tickets_ticket',
        'token_blacklist_outstandingtoken',
        'token_blacklist_blacklistedtoken',
        'sqlite_sequence',
        'django_migrations',
    ]

    # Map old ticket_type values to new TicketType instances
    ticket_type_mapping = {
        'day_pass': {'name': 'Day Pass', 'price': 100.00, 'description': 'One-day access'},
        'session': {'name': 'Session', 'price': 50.00, 'description': 'Single session access'},
    }

    ticket_type_cache = {}  # Cache TicketType IDs by club_id and ticket_type
    default_book_cache = {}  # Cache default TicketBook IDs by club_id

    for table in table_order:
        model = None
        for m in apps.get_models():
            if m._meta.db_table == table:
                model = m
                break
        if not model and table != 'sqlite_sequence':
            print(f"Table {table} not found in models")
            continue

        model_name = f"{model._meta.app_label}.{model._meta.model_name}" if model else table
        old_columns, rows = get_table_data(old_db_path, table)
        if not rows and table != 'tickets_tickettype' and table != 'tickets_ticketbook':
            print(f"Table {table} is empty")
            continue

        print(f"Migrating table {table} ({len(rows)} records)...")

        if table == 'tickets_tickettype':
            # Create TicketType entries for each old ticket_type value
            old_tickets = get_table_data(old_db_path, 'tickets_ticket')[1]
            club_ids = set(row[old_columns.index('club_id')] for row in old_tickets if 'club_id' in old_columns)
            batch = []
            for club_id in club_ids:
                for ticket_type, details in ticket_type_mapping.items():
                    batch.append(model(
                        club_id=club_id,
                        name=details['name'],
                        price=details['price'],
                        description=details['description']
                    ))
                    ticket_type_cache[(club_id, ticket_type)] = None  # Will update with ID after save
            if batch:
                try:
                    created_objects = model.objects.bulk_create(batch)
                    # Update cache with actual IDs
                    for obj in created_objects:
                        for ticket_type in ticket_type_mapping:
                            if obj.name == ticket_type_mapping[ticket_type]['name'] and obj.club_id == club_id:
                                ticket_type_cache[(obj.club_id, ticket_type)] = obj.id
                    print(f"Table {table} migrated successfully with {len(batch)} records")
                except Exception as e:
                    print(f"Error migrating {table}: {e}")
            continue

        if table == 'tickets_ticketbook':
            # Create a default TicketBook for each club
            old_tickets = get_table_data(old_db_path, 'tickets_ticket')[1]
            club_ids = set(row[old_columns.index('club_id')] for row in old_tickets if 'club_id' in old_columns)
            batch = []
            for club_id in club_ids:
                batch.append(model(
                    club_id=club_id,
                    serial_prefix=f"TBK-{club_id}-{int(timezone.now().timestamp())}",
                    issued_date=timezone.now().date(),
                    total_tickets=1000,
                    used_tickets=0
                ))
                default_book_cache[club_id] = None
            if batch:
                try:
                    created_objects = model.objects.bulk_create(batch)
                    for obj in created_objects:
                        default_book_cache[obj.club_id] = obj.id
                    print(f"Table {table} migrated successfully with {len(batch)} records")
                except Exception as e:
                    print(f"Error migrating {table}: {e}")
            continue

        if table == 'sqlite_sequence':
            try:
                conn_new = sqlite3.connect(new_db_path)
                cursor_new = conn_new.cursor()
                cursor_new.execute("DELETE FROM sqlite_sequence")
                for row in rows:
                    cursor_new.execute(f"INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)", row)
                conn_new.commit()
                conn_new.close()
                print(f"Table {table} migrated successfully")
            except sqlite3.OperationalError as e:
                print(f"Error migrating {table}: {e}")
            continue

        new_fields = {field.name: field for field in model._meta.fields}
        new_field_names = set(new_fields.keys())
        old_field_names = set(old_columns)
        missing_fields = new_field_names - old_field_names

        batch = []
        errors = []
        for row_index, row in enumerate(rows):
            row_data = dict(zip(old_columns, row))

            if table == 'tickets_ticket':
                # Convert issue_date to issue_datetime
                if 'issue_date' in row_data:
                    issue_date = row_data['issue_date']
                    if isinstance(issue_date, str):
                        issue_date = datetime.strptime(issue_date, '%Y-%m-%d').date()
                    row_data['issue_datetime'] = datetime.combine(issue_date, time(0, 0))
                    del row_data['issue_date']

                # Map old ticket_type to new TicketType ID
                if 'ticket_type' in row_data:
                    old_ticket_type = row_data['ticket_type']
                    club_id = row_data.get('club_id')
                    ticket_type_id = ticket_type_cache.get((club_id, old_ticket_type))
                    if ticket_type_id is None:
                        errors.append(f"Skipping record in {table}: No TicketType for {old_ticket_type}, club_id: {club_id}")
                        continue
                    row_data['ticket_type_id'] = ticket_type_id
                    del row_data['ticket_type']

                # Assign default TicketBook
                club_id = row_data.get('club_id')
                book_id = default_book_cache.get(club_id)
                if book_id:
                    row_data['book_id'] = book_id

                # Generate unique serial_number
                row_data['serial_number'] = f"TBK-{club_id}-{row_index:05d}"

            if table in ['auth_group_permissions', 'accounts_user_groups', 'staff_shift', 'tickets_ticket']:
                is_valid, error_msg = check_foreign_keys(table, row_data, new_db_path)
                if not is_valid:
                    errors.append(f"Skipping record in {table}: {error_msg}, Data: {row_data}")
                    continue

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
                        row_data[field] = datetime.now()
                    elif isinstance(new_fields[field], models.DateField):
                        row_data[field] = datetime.now().date()
                    elif isinstance(new_fields[field], models.TimeField):
                        row_data[field] = None
                    else:
                        row_data[field] = None

            batch.append(model(**row_data))
            if len(batch) >= 1000:
                try:
                    model.objects.bulk_create(batch)
                except Exception as e:
                    errors.append(f"Error migrating batch for {table}: {e}, Data: {batch[:5]}")
                batch = []

        if batch:
            try:
                model.objects.bulk_create(batch)
            except Exception as e:
                errors.append(f"Error migrating batch for {table}: {e}, Data: {batch[:5]}")

        if errors:
            print(f"Table {table} migrated with {len(errors)} errors:")
            for error in errors:
                print(error)
        else:
            print(f"Table {table} migrated successfully")

    validate_migration(old_db_path, new_db_path)

if __name__ == "__main__":
    OLD_DB_PATH = r"F:\club\club2\src\db_old.sqlite3"
    NEW_DB_PATH = r"F:\club\club2\src\db.sqlite3"
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
    import django
    django.setup()
    migrate_data(OLD_DB_PATH, NEW_DB_PATH)