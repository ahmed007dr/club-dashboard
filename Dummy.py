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
from devices.models import  AllowedDevice
from members.models import Member
from subscriptions.models import SubscriptionType, Subscription,CoachProfile
from tickets.models import TicketType, Ticket
from receipts.models import Receipt
from attendance.models import EntryLog, Attendance
from staff.models import Shift, StaffAttendance
from invites.models import FreeInvite
from finance.models import ExpenseCategory, Expense, IncomeSource, Income
from utils.generate_membership_number import generate_membership_number
import random
import uuid

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
    ticket_serial_counter = 1000
    unique_usernames = set()
    unique_emails = set()
    unique_national_ids = set()
    unique_rfids = set()
    unique_device_ids = set()
    existing_membership_numbers = set(Member.objects.filter(membership_number__isnull=False).values_list('membership_number', flat=True))

    # Create 3 Clubs
    clubs = []
    for i in range(3):
        club = Club.objects.create(
            name=f"Club {fake.company()}"[:50],
            location=fake.address()[:100],
            created_at=timezone.now()
        )
        clubs.append(club)
    print("Created 3 clubs")

    # Create Subscription Types (3 types per club)
    subscription_types = []
    for club in clubs:
        for name, duration, price, gym, pool, classes, max_entries in [
            ('Basic', 30, 100.00, True, False, False, 30),
            ('Premium', 90, 250.00, True, True, False, 60),
            ('Elite', 180, 450.00, True, True, True, 90),
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
                max_freeze_days=random.randint(5, 15)
            )
            subscription_types.append(sub_type)
    print("Created subscription types")

    # Create Ticket Types (2 types per club)
    ticket_types = []
    for club in clubs:
        for name, price in [
            ('Day Pass', 50.00),
            ('Class Session', 30.00),
        ]:
            ticket_type = TicketType.objects.create(
                club=club,
                name=name,
                price=price,
                description=fake.sentence()[:100]
            )
            ticket_types.append(ticket_type)
    print("Created ticket types")

    # Create 100 Staff Users
    roles = ['owner', 'admin', 'reception', 'accountant', 'coach']
    staff_users = []
    users_to_create = []
    existing_rfids = set(User.objects.filter(rfid_code__isnull=False).values_list('rfid_code', flat=True))
    existing_usernames = set(User.objects.filter(username__isnull=False).values_list('username', flat=True))
    existing_emails = set(User.objects.filter(email__isnull=False).values_list('email', flat=True))
    for _ in range(100):
        while True:
            username = serial_generator("user", user_counter, 8)[:8]
            email = serial_generator("user", user_counter, 8) + "@example.com"
            if username not in unique_usernames and email not in unique_emails and username not in existing_usernames and email not in existing_emails:
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
            role=random.choice(roles),
            first_name=fake.first_name()[:30],
            last_name=fake.last_name()[:30],
            rfid_code=rfid,
            club=random.choice(clubs),
            phone_number=fake.phone_number()[:15],
            address=fake.address()[:100],
            notes=fake.sentence()[:100] if random.random() < 0.5 else None,
            card_number=serial_generator("CARD", user_counter, 10) if random.random() < 0.8 else None
        )
        users_to_create.append(user)
        user_counter += 1
        rfid_counter += 1
    User.objects.bulk_create(users_to_create)
    staff_users = User.objects.filter(username__in=[u.username for u in users_to_create]).all()
    print(f"Created {len(staff_users)} staff users")

    # Create Coach Profiles for Coach Users
    coach_users = [u for u in staff_users if u.role == 'coach']
    coach_profiles = []
    for coach in coach_users:
        profile = CoachProfile(
            user=coach,
            max_trainees=random.randint(5, 20)
        )
        coach_profiles.append(profile)
    CoachProfile.objects.bulk_create(coach_profiles)
    print(f"Created {len(coach_profiles)} coach profiles")

    # Create Allowed Devices for 50% of Users
    allowed_devices = []
    for user in random.sample(list(staff_users), len(staff_users) // 2):
        while True:
            device_id = serial_generator("DEV", user_counter, 12)
            if device_id not in unique_device_ids:
                unique_device_ids.add(device_id)
                break
            user_counter += 1
        device = AllowedDevice(
            user=user,
            device_id=device_id,
            device_type=random.choice(['Mobile', 'Desktop', 'Tablet']),
            device_name=f"{fake.word().capitalize()} Device",
            is_active=True,
            last_seen=timezone.now() if random.random() < 0.8 else None,
            device_token=uuid.uuid4()
        )
        allowed_devices.append(device)
    AllowedDevice.objects.bulk_create(allowed_devices)
    print(f"Created {len(allowed_devices)} allowed devices")

    # Create 200 Members
    members = []
    for i in range(200):
        if i % 50 == 0:
            print(f"Creating members: {i}/200")
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
        club = random.choices(clubs, weights=[0.4, 0.3, 0.3])[0]
        member = Member(
            club=club,
            name=fake.name()[:100],
            national_id=national_id,
            membership_number=membership_number,
            birth_date=fake.date_of_birth(minimum_age=18, maximum_age=70),
            phone=fake.phone_number()[:20],
            phone2=fake.phone_number()[:20] if random.random() < 0.5 else None,
            job=fake.job()[:50] if random.random() < 0.7 else None,
            address=fake.address()[:100] if random.random() < 0.8 else None,
            note=fake.sentence(nb_words=6)[:100] if random.random() < 0.5 else None,
            rfid_code=rfid,
            referred_by=None,
            created_at=timezone.now()
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
    for member in random.sample(members, min(20, len(members))):
        possible_referrers = [m for m in members if m != member and m.club == member.club]
        if possible_referrers:
            member.referred_by = random.choice(possible_referrers)
            member.save()
    print("Assigned referrals")

    # Create Subscriptions (1 or 2 per member)
    subscriptions = []
    subscriptions_to_create = []
    for i, member in enumerate(members):
        if i % 50 == 0:
            print(f"Creating subscriptions: {i}/{len(members)}")
        num_subscriptions = random.randint(1, 2)
        club_sub_types = [st for st in subscription_types if st.club == member.club]
        selected_types = random.sample(club_sub_types, min(num_subscriptions, len(club_sub_types)))
        for sub_type in selected_types:
            start_date = fake.date_between(start_date='-6m', end_date='today')
            end_date = start_date + timedelta(days=sub_type.duration_days)
            max_entries = sub_type.max_entries
            entry_count = random.randint(0, max_entries) if max_entries > 0 else 0
            price = sub_type.price
            paid_amount = round(price * random.uniform(0.8, 1.0), 2)
            subscription = Subscription(
                club=member.club,
                member=member,
                type=sub_type,
                coach=random.choice(coach_users) if sub_type.is_private_training and coach_users else None,
                start_date=start_date,
                end_date=end_date,
                private_training_price=price + 50 if sub_type.is_private_training else 0,
                paid_amount=paid_amount,
                remaining_amount=round(price - paid_amount, 2),
                entry_count=entry_count,
                created_by=random.choice(staff_users)
            )
            subscriptions_to_create.append(subscription)
            subscriptions.append(subscription)
    Subscription.objects.bulk_create(subscriptions_to_create)
    print("Created subscriptions for all members")

    # Create Tickets (150 tickets)
    tickets_to_create = []
    for _ in range(150):
        ticket_type = random.choice(ticket_types)
        ticket = Ticket(
            club=ticket_type.club,
            ticket_type=ticket_type,
            notes=fake.sentence()[:100],
            price=ticket_type.price,
            issue_datetime=timezone.make_aware(fake.date_time_this_year()),
            issued_by=random.choice(staff_users),
            serial_number=serial_generator("TICK", ticket_serial_counter, 10)
        )
        tickets_to_create.append(ticket)
        ticket_serial_counter += 1
    Ticket.objects.bulk_create(tickets_to_create)
    print("Created 150 tickets")

    # Create Receipts (150 receipts)
    receipts_to_create = []
    for _ in range(150):
        subscription = random.choice(subscriptions) if random.random() < 0.7 else None
        club = subscription.club if subscription else random.choice(clubs)
        member = subscription.member if subscription else random.choice(members)
        receipt = Receipt(
            club=club,
            member=member,
            subscription=subscription,
            amount=round(random.uniform(50.00, 200.00), 2),
            payment_method=random.choice(['cash', 'visa', 'bank']),
            note=fake.sentence()[:100] if random.random() < 0.5 else None,
            issued_by=random.choice(staff_users),
            invoice_number=serial_generator("INV", invoice_counter, 5),
            date=timezone.make_aware(fake.date_time_this_year())
        )
        receipts_to_create.append(receipt)
        invoice_counter += 1
    Receipt.objects.bulk_create(receipts_to_create)
    print("Created 150 receipts")

    # Create Entry Logs (200 logs)
    entry_logs_to_create = []
    for _ in range(200):
        member = random.choice(members)
        member_subscriptions = [s for s in subscriptions if s.member == member]
        related_subscription = random.choice(member_subscriptions) if member_subscriptions and random.random() < 0.7 else None
        timestamp = timezone.make_aware(fake.date_time_between(start_date='-1y', end_date='now'))
        entry_log = EntryLog(
            club=member.club,
            member=member,
            approved_by=random.choice(staff_users) if random.random() < 0.8 else None,
            related_subscription=related_subscription,
            timestamp=timestamp
        )
        entry_logs_to_create.append(entry_log)
    EntryLog.objects.bulk_create(entry_logs_to_create)
    print("Created 200 entry logs")

    # Create Attendance Records (200 records)
    attendance_to_create = []
    subscriptions_to_update = []
    for _ in range(200):
        member = random.choice(members)
        member_subscriptions = [s for s in subscriptions if s.member == member]
        if not member_subscriptions:
            continue
        subscription = random.choice(member_subscriptions)
        if subscription.type.max_entries > 0 and subscription.entry_count >= subscription.type.max_entries:
            continue
        attendance = Attendance(
            subscription=subscription,
            approved_by=random.choice(staff_users) if random.random() < 0.7 else None
        )
        attendance_to_create.append(attendance)
        subscription.entry_count += 1
        subscriptions_to_update.append(subscription)
    Attendance.objects.bulk_create(attendance_to_create)
    Subscription.objects.bulk_update(subscriptions_to_update, ['entry_count'])
    print("Created 200 attendance records")

    # Create Shifts (150 shifts)
    shifts = []
    shifts_to_create = []
    for _ in range(150):
        date = fake.date_this_year()
        start_time = fake.time_object()
        end_time = (datetime.combine(date, start_time) + timedelta(hours=random.randint(4, 8))).time()
        shift_end_date = date if end_time >= start_time else date + timedelta(days=1)
        shift = Shift(
            club=random.choice(clubs),
            staff=random.choice(staff_users),
            date=date,
            shift_start=start_time,
            shift_end=end_time,
            shift_end_date=shift_end_date if end_time < start_time else None,
            approved_by=random.choice(staff_users) if random.random() < 0.5 else None
        )
        shifts_to_create.append(shift)
        shifts.append(shift)
    Shift.objects.bulk_create(shifts_to_create)
    print("Created 150 shifts")

    # Create Staff Attendance (100 records)
    staff_attendance_to_create = []
    for _ in range(100):
        shift = random.choice(shifts)
        check_in = timezone.make_aware(
            datetime.combine(shift.date, shift.shift_start) + timedelta(minutes=random.randint(-15, 15))
        )
        check_out = None
        if random.random() < 0.7:
            check_out = timezone.make_aware(
                datetime.combine(shift.shift_end_date or shift.date, shift.shift_end) + timedelta(minutes=random.randint(-15, 15))
            )
        staff_attendance = StaffAttendance(
            staff=shift.staff,
            club=shift.club,
            shift=shift,
            check_in=check_in,
            check_out=check_out
        )
        staff_attendance_to_create.append(staff_attendance)
    StaffAttendance.objects.bulk_create(staff_attendance_to_create)
    print("Created 100 staff attendance records")

    # Create Free Invites (150 invites)
    free_invites_to_create = []
    for _ in range(150):
        free_invite = FreeInvite(
            club=random.choice(clubs),
            guest_name=fake.name()[:100],
            phone=fake.phone_number()[:20],
            date=fake.date_this_month(),
            status=random.choice(['pending', 'used']),
            invited_by=random.choice(members) if random.random() < 0.6 else None,
            created_at=timezone.make_aware(fake.date_time_this_year())
        )
        free_invites_to_create.append(free_invite)
    FreeInvite.objects.bulk_create(free_invites_to_create)
    print("Created 150 free invites")

    # Create Expense Categories (3 per club)
    expense_categories = []
    for club in clubs:
        for name in ['Utilities', 'Maintenance', 'Supplies']:
            category = ExpenseCategory(
                club=club,
                name=name,
                description=fake.sentence()[:100]
            )
            expense_categories.append(category)
    ExpenseCategory.objects.bulk_create(expense_categories)
    print("Created expense categories")

    # Create Expenses (150 expenses)
    expenses_to_create = []
    for _ in range(150):
        club = random.choice(clubs)
        club_categories = [c for c in expense_categories if c.club == club]
        expense = Expense(
            club=club,
            category=random.choice(club_categories) if club_categories else None,
            amount=round(random.uniform(50.00, 200.00), 2),
            description=fake.sentence()[:100],
            date=fake.date_this_year(),
            paid_by=random.choice(staff_users),
            invoice_number=serial_generator("INV", invoice_counter, 5)
        )
        expenses_to_create.append(expense)
        invoice_counter += 1
    Expense.objects.bulk_create(expenses_to_create)
    print("Created 150 expenses")

    # Create Income Sources (3 per club)
    income_sources = []
    for club in clubs:
        for name in ['Membership', 'Tickets', 'Sponsorship']:
            source = IncomeSource(
                club=club,
                name=name,
                description=fake.sentence()[:100],
                price=round(random.uniform(50.00, 200.00), 2)
            )
            income_sources.append(source)
    IncomeSource.objects.bulk_create(income_sources)
    print("Created income sources")

    # Create Incomes (150 incomes)
    incomes_to_create = []
    receipts = Receipt.objects.all()
    for _ in range(150):
        receipt = random.choice(receipts) if receipts and random.random() < 0.5 else None
        club = receipt.club if receipt else random.choice(clubs)
        club_sources = [s for s in income_sources if s.club == club]
        income = Income(
            club=club,
            source=random.choice(club_sources) if club_sources else None,
            amount=round(random.uniform(50.00, 200.00), 2),
            description=fake.sentence()[:100],
            date=fake.date_this_year(),
            received_by=random.choice(staff_users),
            related_receipt=receipt
        )
        incomes_to_create.append(income)
    Income.objects.bulk_create(incomes_to_create)
    print("Created 150 incomes")

    print("Dummy data created successfully!")

if __name__ == "__main__":
    create_dummy_data()