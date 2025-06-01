import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()
from datetime import timedelta, datetime
from django.utils import timezone
from django.db.utils import IntegrityError
from faker import Faker
from core.models import Club
from accounts.models import User
from members.models import Member
from subscriptions.models import SubscriptionType, Subscription, FreezeRequest, CoachProfile
from tickets.models import Ticket
from receipts.models import Receipt
from attendance.models import EntryLog, Attendance
from staff.models import Shift, StaffAttendance
from invites.models import FreeInvite
from finance.models import ExpenseCategory, Expense, IncomeSource, Income
from utils.generate_membership_number import generate_membership_number
from utils.generate_invoice import generate_invoice_number
import random

fake = Faker()

# Custom serial generator for unique fields
def serial_generator(prefix, counter, length=8):
    """Generate unique serial numbers with a prefix."""
    return f"{prefix}{str(counter).zfill(length)}"

def create_dummy_data():
    # Initialize counters for unique fields
    user_counter = 10000000
    member_counter = 10000000
    rfid_counter = 10000000
    invoice_counter = 1000
    unique_usernames = set()
    unique_emails = set()
    unique_national_ids = set()
    unique_rfids = set()
    existing_membership_numbers = set(Member.objects.filter(membership_number__isnull=False).values_list('membership_number', flat=True))

    # Create 1 Club
    club = Club.objects.create(
        name="نادي اللياقة المثالي",
        location="القاهرة, مصر",
        created_at=timezone.now()
    )
    print("Created 1 club")

    # Create Subscription Types (3 types for the club)
    subscription_types = []
    for name, duration, price, gym, pool, classes, max_entries, is_private in [
        ('أساسي', 30, 500.00, True, False, False, 20, False),
        ('مميز', 90, 1200.00, True, True, False, 50, False),
        ('تدريب خاص', 30, 2000.00, True, False, True, 15, True),
    ]:
        sub_type = SubscriptionType.objects.create(
            club=club,
            name=name,
            duration_days=duration,
            price=price,
            includes_gym=gym,
            includes_pool=pool,
            includes_classes=classes,
            max_entries=max_entries,
            is_private_training=is_private,
            max_freeze_days=10
        )
        subscription_types.append(sub_type)
    print("Created 3 subscription types")

    # Create 10 Staff Users
    roles = ['owner', 'admin', 'reception', 'accountant', 'coach']
    staff_users = []
    users_to_create = []
    existing_rfids = set(User.objects.filter(rfid_code__isnull=False).values_list('rfid_code', flat=True))
    existing_usernames = set(User.objects.filter(username__isnull=False).values_list('username', flat=True))
    existing_emails = set(User.objects.filter(email__isnull=False).values_list('email', flat=True))
    role_counts = {'owner': 1, 'admin': 1, 'reception': 3, 'accountant': 2, 'coach': 3}
    for role in roles:
        for _ in range(role_counts[role]):
            while True:
                username = serial_generator("user", user_counter, 8)[:8]
                email = serial_generator("user", user_counter, 8) + "@example.com"
                if (username not in unique_usernames and email not in unique_emails and
                    username not in existing_usernames and email not in existing_emails):
                    unique_usernames.add(username)
                    unique_emails.add(email)
                    break
                user_counter += 1
            while True:
                rfid = serial_generator("RFID", rfid_counter, 8)
                if rfid not in unique_rfids and rfid not in existing_rfids:
                    unique_rfids.add(rfid)
                    break
                rfid_counter += 1
            user = User(
                username=username,
                email=email,
                password='pbkdf2_sha256$390000$123456789012$12345678901234567890123456789012',  # Hashed '123'
                role=role,
                first_name=fake.first_name()[:30],
                last_name=fake.last_name()[:30],
                rfid_code=rfid,
                club=club,
                is_active=True
            )
            users_to_create.append(user)
            user_counter += 1
            rfid_counter += 1
    User.objects.bulk_create(users_to_create)
    staff_users = User.objects.filter(username__in=[u.username for u in users_to_create]).all()
    print(f"Created {len(staff_users)} staff users")

    # Create Coach Profiles for coaches
    coaches = [u for u in staff_users if u.role == 'coach']
    for coach in coaches:
        CoachProfile.objects.get_or_create(
            user=coach,
            defaults={'max_trainees': 10}
        )
    print(f"Created coach profiles for {len(coaches)} coaches")

    # Create 20 Members
    members = []
    for i in range(20):
        while True:
            national_id = serial_generator("NAT", member_counter, 14)
            if national_id not in unique_national_ids:
                unique_national_ids.add(national_id)
                break
            member_counter += 1
        while True:
            rfid = serial_generator("RFID", rfid_counter, 10)
            if rfid not in unique_rfids:
                unique_rfids.add(rfid)
                break
            rfid_counter += 1
        while True:
            try:
                membership_number = generate_membership_number(created_at=fake.date_time_this_year())
                if membership_number not in existing_membership_numbers:
                    existing_membership_numbers.add(membership_number)
                    break
            except ValueError:
                continue
        member = Member(
            club=club,
            name=fake.name()[:100],
            national_id=national_id,
            membership_number=membership_number,
            birth_date=fake.date_of_birth(minimum_age=18, maximum_age=70),
            phone=fake.phone_number()[:20],
            phone2=fake.phone_number()[:20] if fake.boolean() else None,
            job=fake.job()[:50],
            address=fake.address()[:100],
            note=fake.sentence(nb_words=6)[:100],
            rfid_code=rfid
        )
        try:
            member.save()
            members.append(member)
        except IntegrityError as e:
            print(f"Skipped member due to error: {e}")
            continue
        member_counter += 1
        rfid_counter += 1
    print(f"Created {len(members)} members")

    # Update referrals (10% of members)
    for member in random.sample(members, min(2, len(members))):
        possible_referrers = [m for m in members if m != member]
        if possible_referrers:
            member.referred_by = random.choice(possible_referrers)
            member.save()
    print("Assigned referrals")

    # Create Subscriptions (1 or 2 per member)
    subscriptions = []
    subscriptions_to_create = []
    subscriptions_to_update = []
    today = timezone.now().date()
    for i, member in enumerate(members):
        num_subscriptions = random.randint(1, 2)
        selected_types = random.sample(subscription_types, min(num_subscriptions, len(subscription_types)))
        for sub_type in selected_types:
            start_date = fake.date_between(start_date='-6m', end_date='today')
            end_date = start_date + timedelta(days=sub_type.duration_days)
            max_entries = sub_type.max_entries
            entry_count = random.randint(0, max_entries // 2) if max_entries > 0 else 0
            coach = random.choice(coaches) if sub_type.is_private_training and coaches else None
            private_price = 2500 if sub_type.is_private_training else 0
            subscription = Subscription(
                club=club,
                member=member,
                type=sub_type,
                coach=coach,
                start_date=start_date,
                end_date=end_date,
                private_training_price=private_price,
                paid_amount=round((private_price or sub_type.price) * random.uniform(0.8, 1.0), 2),
                remaining_amount=round((private_price or sub_type.price) * random.uniform(0.0, 0.2), 2),
                entry_count=entry_count,
                created_by=random.choice(staff_users)
            )
            subscriptions_to_create.append(subscription)
            subscriptions.append(subscription)
    Subscription.objects.bulk_create(subscriptions_to_create)
    print(f"Created {len(subscriptions)} subscriptions")

    # Create Freeze Requests (5 requests)
    freeze_requests = []
    for subscription in random.sample(subscriptions, min(5, len(subscriptions))):
        freeze_request = FreezeRequest(
            subscription=subscription,
            requested_days=5,
            start_date=today + timedelta(days=random.randint(1, 10)),
            created_by=random.choice(staff_users)
        )
        freeze_requests.append(freeze_request)
    FreezeRequest.objects.bulk_create(freeze_requests)
    print(f"Created {len(freeze_requests)} freeze requests")

    # Create Tickets (20 tickets)
    tickets_to_create = []
    for _ in range(20):
        ticket = Ticket(
            club=club,
            buyer_name=fake.name()[:100],
            ticket_type=random.choice(['day_pass', 'session']),
            price=round(random.uniform(50.00, 150.00), 2),
            used=fake.boolean(),
            used_by=random.choice(members) if fake.boolean() else None
        )
        tickets_to_create.append(ticket)
    Ticket.objects.bulk_create(tickets_to_create)
    print("Created 20 tickets")

    # Create Receipts (20 receipts)
    receipts_to_create = []
    existing_invoices = set(Receipt.objects.filter(invoice_number__isnull=False).values_list('invoice_number', flat=True))
    for subscription in subscriptions:
        while True:
            invoice_number = serial_generator("INV", invoice_counter, 5)
            if invoice_number not in existing_invoices:
                existing_invoices.add(invoice_number)
                break
            invoice_counter += 1
        receipt = Receipt(
            club=club,
            member=subscription.member,
            subscription=subscription,
            amount=subscription.paid_amount,
            payment_method=random.choice(['cash', 'visa', 'bank']),
            note=fake.sentence()[:100],
            issued_by=random.choice(staff_users),
            invoice_number=invoice_number
        )
        receipts_to_create.append(receipt)
        invoice_counter += 1
    # Use individual save to handle potential errors
    for receipt in receipts_to_create:
        try:
            receipt.save()
        except IntegrityError as e:
            print(f"Skipped receipt due to error: {e}")
    print(f"Created {len(receipts_to_create)} receipts")

    # Create Entry Logs (30 logs)
    entry_logs_to_create = []
    for _ in range(30):
        member = random.choice(members)
        member_subscriptions = [s for s in subscriptions if s.member == member]
        related_subscription = random.choice(member_subscriptions) if member_subscriptions and fake.boolean() else None
        timestamp = fake.date_time_between(start_date='-1y', end_date='now')
        entry_log = EntryLog(
            club=club,
            member=member,
            approved_by=random.choice(staff_users),
            related_subscription=related_subscription,
            timestamp=timestamp
        )
        entry_logs_to_create.append(entry_log)
    EntryLog.objects.bulk_create(entry_logs_to_create)
    print("Created 30 entry logs")

    # Create Attendance Records (30 records)
    attendance_to_create = []
    for _ in range(30):
        member = random.choice(members)
        member_subscriptions = [s for s in subscriptions if s.member == member]
        if not member_subscriptions:
            continue
        subscription = random.choice(member_subscriptions)
        if subscription.type.max_entries > 0 and subscription.entry_count >= subscription.type.max_entries:
            continue
        attendance = Attendance(
            subscription=subscription
        )
        attendance_to_create.append(attendance)
        subscription.entry_count += 1
        subscriptions_to_update.append(subscription)
    Attendance.objects.bulk_create(attendance_to_create)
    Subscription.objects.bulk_update(subscriptions_to_update, ['entry_count'])
    print(f"Created {len(attendance_to_create)} attendance records")

    # Create Shifts (20 shifts)
    shifts = []
    shifts_to_create = []
    for _ in range(20):
        date = fake.date_this_year()
        start_time = fake.time_object()
        end_time = (datetime.combine(date, start_time) + timedelta(hours=random.randint(4, 8))).time()
        shift_end_date = date if end_time >= start_time else date + timedelta(days=1)
        shift = Shift(
            club=club,
            staff=random.choice(staff_users),
            date=date,
            shift_start=start_time,
            shift_end=end_time,
            shift_end_date=shift_end_date if end_time < start_time else None,
            approved_by=random.choice(staff_users) if fake.boolean() else None
        )
        shifts_to_create.append(shift)
        shifts.append(shift)
    Shift.objects.bulk_create(shifts_to_create)
    print("Created 20 shifts")

    # Create Staff Attendance (15 records)
    staff_attendance_to_create = []
    for _ in range(15):
        shift = random.choice(shifts)
        check_in = timezone.make_aware(
            datetime.combine(shift.date, shift.shift_start) + timedelta(minutes=random.randint(-15, 15))
        )
        check_out = None
        if fake.boolean():
            check_out = timezone.make_aware(
                datetime.combine(shift.shift_end_date or shift.date, shift.shift_end) + timedelta(minutes=random.randint(-15, 15))
            )
        staff_attendance = StaffAttendance(
            staff=shift.staff,
            club=club,
            shift=shift,
            check_in=check_in,
            check_out=check_out
        )
        staff_attendance_to_create.append(staff_attendance)
    StaffAttendance.objects.bulk_create(staff_attendance_to_create)
    print("Created 15 staff attendance records")

    # Create Free Invites (10 invites)
    free_invites_to_create = []
    for _ in range(10):
        free_invite = FreeInvite(
            club=club,
            guest_name=fake.name()[:100],
            phone=fake.phone_number()[:20],
            date=fake.date_this_month(),
            status=random.choice(['pending', 'used']),
            invited_by=random.choice(members) if fake.boolean() else None
        )
        free_invites_to_create.append(free_invite)
    FreeInvite.objects.bulk_create(free_invites_to_create)
    print("Created 10 free invites")

    # Create Expense Categories (3 for the club)
    expense_categories = []
    for name in ['صيانة', 'مرافق', 'إمدادات']:
        category = ExpenseCategory(
            club=club,
            name=name,
            description=fake.sentence()[:100]
        )
        expense_categories.append(category)
    ExpenseCategory.objects.bulk_create(expense_categories)
    print("Created 3 expense categories")

    # Create Expenses (10 expenses)
    expenses_to_create = []
    existing_invoices = set(Expense.objects.filter(invoice_number__isnull=False).values_list('invoice_number', flat=True))
    for _ in range(10):
        while True:
            invoice_number = serial_generator("INV", invoice_counter, 5)
            if invoice_number not in existing_invoices:
                existing_invoices.add(invoice_number)
                break
            invoice_counter += 1
        expense = Expense(
            club=club,
            category=random.choice(expense_categories),
            amount=round(random.uniform(100.00, 1000.00), 2),
            description=fake.sentence()[:100],
            date=fake.date_this_year(),
            paid_by=random.choice(staff_users),
            invoice_number=invoice_number
        )
        expenses_to_create.append(expense)
        invoice_counter += 1
    Expense.objects.bulk_create(expenses_to_create)
    print("Created 10 expenses")

    # Create Income Sources (3 for the club)
    income_sources = []
    for name in ['اشتراكات', 'تذاكر', 'رعاية']:
        source = IncomeSource(
            club=club,
            name=name,
            description=fake.sentence()[:100]
        )
        income_sources.append(source)
    IncomeSource.objects.bulk_create(income_sources)
    print("Created 3 income sources")

    # Create Incomes (20 incomes)
    incomes_to_create = []
    for _ in range(20):
        receipt = random.choice(Receipt.objects.all()) if fake.boolean() else None
        income = Income(
            club=club,
            source=random.choice(income_sources),
            amount=round(random.uniform(100.00, 2000.00), 2),
            description=fake.sentence()[:100],
            date=fake.date_this_year(),
            received_by=random.choice(staff_users),
            related_receipt=receipt
        )
        incomes_to_create.append(income)
    Income.objects.bulk_create(incomes_to_create)
    print("Created 20 incomes")

    print("Dummy data created successfully!")

if __name__ == "__main__":
    create_dummy_data()
