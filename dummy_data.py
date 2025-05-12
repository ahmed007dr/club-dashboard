import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()
from datetime import timedelta, datetime
from django.utils import timezone
from faker import Faker
from core.models import Club
from accounts.models import User
from members.models import Member
from subscriptions.models import SubscriptionType, Subscription
from tickets.models import Ticket
from receipts.models import Receipt
from attendance.models import EntryLog, Attendance
from staff.models import Shift, StaffAttendance
from invites.models import FreeInvite
from finance.models import ExpenseCategory, Expense, IncomeSource, Income
import random
from django.db import transaction
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

fake = Faker()

def create_dummy_data():
    # Use transactions to improve performance
    with transaction.atomic():
        # Create Clubs
        clubs = []
        for _ in range(10):
            club = Club.objects.create(
                name=fake.company(),
                location=fake.address(),
                created_at=timezone.now()
            )
            clubs.append(club)
        logger.info(f"Created {len(clubs)} clubs")

        # Create Users (with different roles including owner and staff)
        roles = ['owner', 'admin', 'reception', 'accountant', 'coach']
        users = []
        for i in range(1000):  # 1000 users
            # Generate a unique username by appending an index
            base_username = fake.user_name()
            username = f"{base_username[:6]}{i:04d}"[:8]  # Ensure max 8 chars
            try:
                user = User.objects.create_user(
                    username=username,
                    email=fake.email(),
                    password='123',
                    club=random.choice(clubs),
                    role=random.choice(roles),
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    rfid_code=fake.unique.bothify(text='########') if 'staff' in roles else None
                )
                users.append(user)
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create user with username {username}: {e}")
                continue
        logger.info(f"Created {len(users)} users")

        # Ensure at least 100 staff users
        staff_users = [u for u in users if u.role == 'admin']
        i = 0
        while len(staff_users) < 100:
            username = f"staff{i:06d}"[:8]
            try:
                user = User.objects.create_user(
                    username=username,
                    email=fake.email(),
                    password='123',
                    club=random.choice(clubs),
                    role='admin',
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    rfid_code=fake.unique.bothify(text='########')
                )
                users.append(user)
                staff_users.append(user)
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create staff user with username {username}: {e}")
            i += 1
        logger.info(f"Created {len(staff_users)} staff users")

        # Rest of the script remains unchanged (Members, Subscriptions, etc.)
        # Create Members
        members = []
        for _ in range(10000):  # 10,000 members
            try:
                member = Member.objects.create(
                    club=random.choice(clubs),
                    name=fake.name(),
                    national_id=fake.unique.numerify(text='##############'),
                    birth_date=fake.date_of_birth(minimum_age=18, maximum_age=70),
                    phone=fake.phone_number()[:20],
                    phone2=fake.phone_number()[:20],
                    job=fake.job(),
                    address=fake.address()[:100],
                    note=fake.sentence(nb_words=6)[:100],
                    rfid_code=fake.unique.bothify(text='RFID-####-####'),
                    referred_by=None
                )
                members.append(member)
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create member: {e}")
                continue
        logger.info(f"Created {len(members)} members")

        # Update some members with referrals
        for member in random.sample(members, min(2000, len(members))):
            possible_referrers = [m for m in members if m != member]
            if possible_referrers:
                member.referred_by = random.choice(possible_referrers)
                member.save()
        logger.info("Updated member referrals")

        # Create Subscription Types
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
                    max_entries=max_entries
                )
                subscription_types.append(sub_type)
        logger.info(f"Created {len(subscription_types)} subscription types")

        # Create Subscriptions
        subscriptions = []
        for member in members:
            sub_type = random.choice([st for st in subscription_types if st.club == member.club])
            start_date = fake.date_this_year()
            end_date = start_date + timedelta(days=sub_type.duration_days)
            max_entries = sub_type.max_entries
            entry_count = random.randint(0, max_entries) if max_entries > 0 else 0
            try:
                subscription = Subscription.objects.create(
                    club=member.club,
                    member=member,
                    type=sub_type,
                    start_date=start_date,
                    end_date=end_date,
                    paid_amount=round(sub_type.price * random.uniform(0.8, 1.0), 2),
                    remaining_amount=round(sub_type.price * random.uniform(0.0, 0.2), 2),
                    entry_count=entry_count
                )
                subscriptions.append(subscription)
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create subscription for member {member.id}: {e}")
                continue
        logger.info(f"Created {len(subscriptions)} subscriptions")

        # Additional subscriptions
        for _ in range(5000):
            member = random.choice(members)
            sub_type = random.choice([st for st in subscription_types if st.club == member.club])
            start_date = fake.date_this_year()
            end_date = start_date + timedelta(days=sub_type.duration_days)
            max_entries = sub_type.max_entries
            entry_count = random.randint(0, max_entries) if max_entries > 0 else 0
            try:
                subscription = Subscription.objects.create(
                    club=member.club,
                    member=member,
                    type=sub_type,
                    start_date=start_date,
                    end_date=end_date,
                    paid_amount=round(sub_type.price * random.uniform(0.8, 1.0), 2),
                    remaining_amount=round(sub_type.price * random.uniform(0.0, 0.2), 2),
                    entry_count=entry_count
                )
                subscriptions.append(subscription)
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create additional subscription: {e}")
                continue
        logger.info(f"Total subscriptions: {len(subscriptions)}")

        # Create Tickets
        for _ in range(50000):
            try:
                Ticket.objects.create(
                    club=random.choice(clubs),
                    buyer_name=fake.name(),
                    ticket_type=random.choice(['day_pass', 'session']),
                    price=round(random.uniform(20.00, 100.00), 2),
                    used=fake.boolean(),
                    used_by=random.choice(members) if fake.boolean() else None,
                    issue_date=fake.date_this_year()
                )
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create ticket: {e}")
                continue
        logger.info("Created 50,000 tickets")

        # Create Receipts
        for _ in range(20000):
            subscription = random.choice(subscriptions) if fake.boolean() else None
            try:
                receipt = Receipt.objects.create(
                    club=subscription.club if subscription else random.choice(clubs),
                    member=subscription.member if subscription else random.choice(members),
                    subscription=subscription,
                    amount=round(random.uniform(50.00, 500.00), 2),
                    payment_method=random.choice(['cash', 'visa', 'bank']),
                    note=fake.sentence(),
                    issued_by=random.choice(users)
                )
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create receipt: {e}")
                continue
        logger.info("Created 20,000 receipts")

        # Create Entry Logs
        for _ in range(100000):
            member = random.choice(members)
            member_subscriptions = [s for s in subscriptions if s.member == member]
            related_subscription = random.choice(member_subscriptions) if member_subscriptions and fake.boolean() else None
            timestamp = fake.date_time_between(start_date='-1y', end_date='now')
            try:
                EntryLog.objects.create(
                    club=member.club,
                    member=member,
                    approved_by=random.choice(users),
                    related_subscription=related_subscription,
                    timestamp=timestamp
                )
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create entry log: {e}")
                continue
        logger.info("Created 100,000 entry logs")

        # Create Attendance Records
        for _ in range(150000):
            member = random.choice(members)
            member_subscriptions = [s for s in subscriptions if s.member == member]
            if not member_subscriptions:
                continue
            subscription = random.choice(member_subscriptions)
            if subscription.type.max_entries > 0 and subscription.entry_count >= subscription.type.max_entries:
                continue
            try:
                Attendance.objects.create(
                    subscription=subscription
                )
                subscription.entry_count += 1
                subscription.save()
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create attendance record: {e}")
                continue
        logger.info("Created 150,000 attendance records")

        # Create Shifts
        shifts = []
        for _ in range(5000):
            date = fake.date_this_year()
            start_time = fake.time_object()
            end_time = (datetime.combine(date, start_time) +
                        timedelta(hours=random.randint(4, 8))).time()
            shift_end_date = date if end_time >= start_time else date + timedelta(days=1)
            try:
                shift = Shift.objects.create(
                    club=random.choice(clubs),
                    staff=random.choice(staff_users),
                    date=date,
                    shift_start=start_time,
                    shift_end=end_time,
                    shift_end_date=shift_end_date if end_time < start_time else None,
                    approved_by=random.choice(users) if fake.boolean() else None
                )
                shifts.append(shift)
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create shift: {e}")
                continue
        logger.info(f"Created {len(shifts)} shifts")

        # Create Staff Attendance
        for _ in range(20000):
            shift = random.choice(shifts)
            check_in = timezone.make_aware(
                datetime.combine(shift.date, shift.shift_start) +
                timedelta(minutes=random.randint(-15, 15))
            )
            check_out = None
            if fake.boolean():
                check_out = timezone.make_aware(
                    datetime.combine(shift.shift_end_date or shift.date, shift.shift_end) +
                    timedelta(minutes=random.randint(-15, 15))
                )
            try:
                StaffAttendance.objects.create(
                    staff=shift.staff,
                    club=shift.club,
                    shift=shift,
                    check_in=check_in,
                    check_out=check_out
                )
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create staff attendance: {e}")
                continue
        logger.info("Created 20,000 staff attendance records")

        # Create Free Invites
        for _ in range(10000):
            try:
                FreeInvite.objects.create(
                    club=random.choice(clubs),
                    guest_name=fake.name(),
                    phone=fake.phone_number()[:20],
                    date=fake.date_this_year(),
                    status=random.choice(['pending', 'used']),
                    invited_by=random.choice(members) if fake.boolean() else None,
                )
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create free invite: {e}")
                continue
        logger.info("Created 10,000 free invites")

        # Create Expense Categories
        expense_categories = []
        for _ in range(10):
            try:
                category = ExpenseCategory.objects.create(
                    club=random.choice(clubs),
                    name=fake.word().capitalize(),
                    description=fake.sentence()
                )
                expense_categories.append(category)
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create expense category: {e}")
                continue
        logger.info(f"Created {len(expense_categories)} expense categories")

        # Create Expenses
        for _ in range(5000):
            try:
                Expense.objects.create(
                    club=random.choice(clubs),
                    category=random.choice(expense_categories),
                    amount=round(random.uniform(50.00, 1000.00), 2),
                    description=fake.sentence(),
                    date=fake.date_this_year(),
                    paid_by=random.choice(users),
                    invoice_number=fake.unique.bothify(text='INV-#####')
                )
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create expense: {e}")
                continue
        logger.info("Created 5,000 expenses")

        # Create Income Sources
        income_sources = []
        for _ in range(10):
            try:
                source = IncomeSource.objects.create(
                    club=random.choice(clubs),
                    name=fake.word().capitalize(),
                    description=fake.sentence()
                )
                income_sources.append(source)
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create income source: {e}")
                continue
        logger.info(f"Created {len(income_sources)} income sources")

        # Create Incomes
        for _ in range(5000):
            receipt = random.choice(Receipt.objects.all()) if fake.boolean() else None
            try:
                Income.objects.create(
                    club=receipt.club if receipt else random.choice(clubs),
                    source=random.choice(income_sources),
                    amount=round(random.uniform(50.00, 1000.00), 2),
                    description=fake.sentence(),
                    date=fake.date_this_year(),
                    received_by=random.choice(users),
                    related_receipt=receipt
                )
            except django.db.utils.IntegrityError as e:
                logger.warning(f"Failed to create income: {e}")
                continue
        logger.info("Created 5,000 incomes")

        print("Large-scale dummy data created successfully!")

if __name__ == "__main__":
    create_dummy_data()