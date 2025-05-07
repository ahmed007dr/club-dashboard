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
from attendance.models import EntryLog
from staff.models import Shift, StaffAttendance
from invites.models import FreeInvite
from finance.models import ExpenseCategory, Expense, IncomeSource, Income
import random


fake = Faker()

def create_dummy_data():
    # Create Clubs
    clubs = []
    for _ in range(2):
        club = Club.objects.create(
            name=fake.company(),
            location=fake.address(),
            created_at=timezone.now()
        )
        clubs.append(club)

    # Create Users (with different roles including owner and staff)
    roles = ['owner', 'admin', 'reception', 'accountant', 'coach', 'staff']
    users = []
    for _ in range(6):  # Increased to ensure enough staff users
        username = fake.user_name()[:5]
        user = User.objects.create_user(
            username=username,
            email=fake.email(),
            password='123',
            club=random.choice(clubs),
            role=random.choice(roles),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            rfid_code=fake.unique.bothify(text='RFID-#####') if 'staff' in roles else None
        )
        users.append(user)

    # Ensure at least 2 staff users
    staff_users = [u for u in users if u.role == 'staff']
    while len(staff_users) < 2:
        username = fake.user_name()[:5]
        user = User.objects.create_user(
            username=username,
            email=fake.email(),
            password='123',
            club=random.choice(clubs),
            role='staff',
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            rfid_code=fake.unique.bothify(text='RFID-#####')
        )
        users.append(user)
        staff_users.append(user)

    # Create Members
    members = []
    for _ in range(10):
        member = Member.objects.create(
            club=random.choice(clubs),
            name=fake.name(),
            membership_number=fake.unique.bothify(text='MEM-#####'),
            national_id=fake.unique.numerify(text='##############'),
            birth_date=fake.date_of_birth(minimum_age=18, maximum_age=70),
            phone=fake.phone_number()[:20],
            created_at=timezone.now(),
            referred_by=None
        )
        members.append(member)

    # Update some members with referrals
    for member in random.sample(members, min(3, len(members))):
        possible_referrers = [m for m in members if m != member]
        if possible_referrers:
            member.referred_by = random.choice(possible_referrers)
            member.save()

    # Create Subscription Types
    subscription_types = []
    for name, duration, price, gym, pool, classes in [
        ('Basic', 30, 100.00, True, False, False),
        ('Premium', 90, 250.00, True, True, False),
        ('Elite', 180, 450.00, True, True, True),
    ]:
        sub_type = SubscriptionType.objects.create(
            name=name,
            duration_days=duration,
            price=price,
            includes_gym=gym,
            includes_pool=pool,
            includes_classes=classes
        )
        subscription_types.append(sub_type)

    # Create Subscriptions
    subscriptions = []
    for _ in range(10):
        member = random.choice(members)
        sub_type = random.choice(subscription_types)
        start_date = fake.date_this_year()
        end_date = start_date + timedelta(days=sub_type.duration_days)
        subscription = Subscription.objects.create(
            club=member.club,
            member=member,
            type=sub_type,
            start_date=start_date,
            end_date=end_date,
            paid_amount=round(sub_type.price * random.uniform(0.8, 1.0), 2),
            remaining_amount=round(sub_type.price * random.uniform(0.0, 0.2), 2),
            attendance_days=random.randint(0, 30)
        )
        subscriptions.append(subscription)

    # Create Tickets
    for _ in range(5):
        Ticket.objects.create(
            club=random.choice(clubs),
            buyer_name=fake.name(),
            ticket_type=random.choice(['day_pass', 'session']),
            price=round(random.uniform(20.00, 100.00), 2),
            used=fake.boolean(),
            used_by=random.choice(members) if fake.boolean() else None,
            issue_date=fake.date_this_year()
        )

    # Create Receipts
    for _ in range(5):
        subscription = random.choice(subscriptions) if fake.boolean() else None
        receipt = Receipt.objects.create(
            club=subscription.club if subscription else random.choice(clubs),
            member=subscription.member if subscription else random.choice(members),
            subscription=subscription,
            amount=round(random.uniform(50.00, 500.00), 2),
            payment_method=random.choice(['cash', 'visa', 'bank']),
            note=fake.sentence(),
            issued_by=random.choice(users)
        )

    # Create Entry Logs
    for _ in range(10):
        EntryLog.objects.create(
            club=random.choice(clubs),
            member=random.choice(members),
            approved_by=random.choice(users),
            related_subscription=random.choice(subscriptions) if fake.boolean() else None
        )

    # Create Shifts
    shifts = []
    for _ in range(10):  # Increased number of shifts
        date = fake.date_this_month()
        start_time = fake.time_object()
        end_time = (datetime.combine(date, start_time) + 
                   timedelta(hours=random.randint(4, 8))).time()
        shift_end_date = date if end_time >= start_time else date + timedelta(days=1)
        
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

    # Create Staff Attendance
    for _ in range(8):
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
        
        StaffAttendance.objects.create(
            staff=shift.staff,
            club=shift.club,
            shift=shift,
            check_in=check_in,
            check_out=check_out
        )

    # Create Free Invites
    for _ in range(5):
        FreeInvite.objects.create(
            club=random.choice(clubs),
            guest_name=fake.name(),
            phone=fake.phone_number()[:20],
            date=fake.date_this_month(),
            status=random.choice(['pending', 'used']),
            invited_by=random.choice(members) if fake.boolean() else None,
            handled_by=random.choice(users) if fake.boolean() else None
        )

    # Create Expense Categories
    expense_categories = []
    for _ in range(3):
        category = ExpenseCategory.objects.create(
            club=random.choice(clubs),
            name=fake.word().capitalize(),
            description=fake.sentence()
        )
        expense_categories.append(category)

    # Create Expenses
    for _ in range(5):
        Expense.objects.create(
            club=random.choice(clubs),
            category=random.choice(expense_categories),
            amount=round(random.uniform(50.00, 1000.00), 2),
            description=fake.sentence(),
            date=fake.date_this_year(),
            paid_by=random.choice(users),
            invoice_number=fake.unique.bothify(text='INV-#####')
        )

    # Create Income Sources
    income_sources = []
    for _ in range(3):
        source = IncomeSource.objects.create(
            club=random.choice(clubs),
            name=fake.word().capitalize(),
            description=fake.sentence()
        )
        income_sources.append(source)

    # Create Incomes
    for _ in range(5):
        receipt = random.choice(Receipt.objects.all()) if fake.boolean() else None
        Income.objects.create(
            club=receipt.club if receipt else random.choice(clubs),
            source=random.choice(income_sources),
            amount=round(random.uniform(50.00, 1000.00), 2),
            description=fake.sentence(),
            date=fake.date_this_year(),
            received_by=random.choice(users),
            related_receipt=receipt
        )

    print("Dummy data created successfully!")

if __name__ == "__main__":
    create_dummy_data()