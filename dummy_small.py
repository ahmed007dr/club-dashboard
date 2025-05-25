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
from subscriptions.models import SubscriptionType, Subscription, PrivateSubscriptionPayment
from tickets.models import Ticket
from receipts.models import Receipt
from attendance.models import EntryLog, Attendance
from staff.models import Shift, StaffAttendance
from invites.models import FreeInvite
from finance.models import ExpenseCategory, Expense, IncomeSource, Income
from payroll.models import PayrollPeriod, Payroll, PayrollDeduction, EmployeeContract, CoachPercentage
from utils.generate_membership_number import generate_membership_number
import random

fake = Faker()

# Custom serial generator for unique fields
def serial_generator(prefix, counter, length=8):
    """Generate unique serial numbers with a prefix."""
    return f"{prefix}{str(counter).zfill(length)}"

def create_dummy_data():
    # Initialize counters and sets for unique fields
    user_counter = 10000000
    member_counter = 10000000
    rfid_counter = 10000000
    invoice_counter = 1000
    unique_usernames = set()
    unique_emails = set()
    unique_national_ids = set()
    unique_rfids = set()
    existing_membership_numbers = set(Member.objects.filter(membership_number__isnull=False).values_list('membership_number', flat=True))
    existing_rfids = set(User.objects.filter(rfid_code__isnull=False).values_list('rfid_code', flat=True))
    existing_usernames = set(User.objects.filter(username__isnull=False).values_list('username', flat=True))
    existing_emails = set(User.objects.filter(email__isnull=False).values_list('email', flat=True))

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

    # Create Subscription Types (3 types per club, including private)
    subscription_types = []
    for club in clubs:
        for name, duration, price, gym, pool, classes, max_entries, is_private, private_fee in [
            ('Basic', 30, 100.00, True, False, False, 30, False, None),
            ('Premium', 90, 250.00, True, True, False, 60, False, None),
            ('Elite Private', 180, 450.00, True, True, True, 90, True, 100.00),
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
                is_private=is_private,
                private_fee=private_fee
            )
            subscription_types.append(sub_type)
    print("Created subscription types")

    # Create 100 Staff Users (30 active, 70 inactive)
    roles_active = ['owner', 'admin', 'reception']
    roles_inactive = ['coach', 'accountant']
    staff_users = []
    users_to_create = []
    for _ in range(100):
        role = random.choices(
            roles_active + roles_inactive,
            weights=[0.1, 0.1, 0.1, 0.35, 0.35], k=1
        )[0]
        is_active = role in roles_active
        # Generate username for all users
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
            role=role,
            first_name=fake.first_name()[:30],
            last_name=fake.last_name()[:30],
            rfid_code=rfid,
            club=random.choice(clubs),
            phone=fake.phone_number()[:15] if fake.boolean() else None,
            birth_date=fake.date_of_birth(minimum_age=18, maximum_age=50) if fake.boolean() else None,
            qualifications=fake.job()[:100] if fake.boolean() else None,
            is_active=is_active
        )
        users_to_create.append(user)
        user_counter += 1
        rfid_counter += 1
    User.objects.bulk_create(users_to_create)
    staff_users = User.objects.filter(rfid_code__in=[u.rfid_code for u in users_to_create]).all()
    print(f"Created {len(staff_users)} staff users (30 active, 70 inactive)")


    # Create Employee Contracts for Coaches and Accountants
    employee_contracts = []
    for user in staff_users:
        if user.role in ['coach', 'accountant']:
            contract = EmployeeContract(
                employee=user,
                club=user.club,
                hourly_rate=round(random.uniform(20.00, 50.00), 2),
                start_date=fake.date_this_year(),
                end_date=None
            )
            employee_contracts.append(contract)
    EmployeeContract.objects.bulk_create(employee_contracts)
    print(f"Created {len(employee_contracts)} employee contracts")

    # Create Coach Percentages for Coaches
    coach_percentages = []
    for user in staff_users:
        if user.role == 'coach':
            percentage = CoachPercentage(
                coach=user,
                club=user.club,
                coach_percentage=70.00,
                club_percentage=30.00,
                effective_date=fake.date_this_year()
            )
            coach_percentages.append(percentage)
    CoachPercentage.objects.bulk_create(coach_percentages)
    print(f"Created {len(coach_percentages)} coach percentages")

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
            if rfid not in unique_rfids and rfid not in existing_rfids:
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
            phone2=fake.phone_number()[:20] if fake.boolean() else None,
            job=fake.job()[:50],
            address=fake.address()[:100],
            note=fake.sentence(nb_words=6)[:100],
            rfid_code=rfid,
            referred_by=None
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

    # Update Referrals (10% of members)
    for member in random.sample(members, min(20, len(members))):
        possible_referrers = [m for m in members if m != member and m.club == member.club]
        if possible_referrers:
            member.referred_by = random.choice(possible_referrers)
            member.save()
    print("Assigned referrals")

    # Create Subscriptions (1 or 2 per member)
    subscriptions = []
    subscriptions_to_create = []
    subscriptions_to_update = []
    coaches = [u for u in staff_users if u.role == 'coach']
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
            coach = random.choice(coaches) if sub_type.is_private and coaches else None
            subscription = Subscription(
                club=member.club,
                member=member,
                type=sub_type,
                coach=coach,
                start_date=start_date,
                end_date=end_date,
                paid_amount=sub_type.price,  # No discounts
                remaining_amount=0,
                entry_count=entry_count
            )
            subscriptions_to_create.append(subscription)
            subscriptions.append(subscription)
    Subscription.objects.bulk_create(subscriptions_to_create)
    print("Created subscriptions for all members")

    # Create Private Subscription Payments for Private Subscriptions
    private_payments = []
    for subscription in subscriptions:
        if subscription.type.is_private:
            payment = PrivateSubscriptionPayment(
                subscription=subscription,
                club=subscription.club,
                amount=subscription.paid_amount,
                coach_share=subscription.paid_amount * 0.7,  # 70% coach share
                created_at=fake.date_time_between(start_date=subscription.start_date, end_date=subscription.end_date)
            )
            private_payments.append(payment)
    PrivateSubscriptionPayment.objects.bulk_create(private_payments)
    print(f"Created {len(private_payments)} private subscription payments")

    # Create Payroll Periods (3 periods per club)
    payroll_periods = []
    used_start_dates = {club.id: set() for club in clubs}  # Track used start dates per club
    for club in clubs:
        for i in range(3):
            while True:
                start_date = fake.date_between(start_date='-3m', end_date='today')
                if start_date not in used_start_dates[club.id]:
                    used_start_dates[club.id].add(start_date)
                    break
            end_date = start_date + timedelta(days=30)
            period = PayrollPeriod(
                club=club,
                start_date=start_date,
                end_date=end_date,
                is_active=i == 0  # Only the latest period is active
            )
            payroll_periods.append(period)
    PayrollPeriod.objects.bulk_create(payroll_periods)
    print("Created payroll periods")


    # Create Payroll Records (for each staff user in each period)
    payrolls = []
    for period in payroll_periods:
        for user in staff_users:
            if user.club != period.club:
                continue
            payroll = Payroll(
                employee=user,
                club=period.club,
                period=period,
                expected_hours=random.randint(100, 200) if user.role in ['coach', 'accountant'] else 0,
                actual_hours=0,  # Will be calculated
                absent_hours=0,
                base_salary=0,
                absence_deduction=0,
                private_earnings=0,
                bonuses=round(random.uniform(0, 50), 2),
                total_deductions=0,
                total_salary=0,
                is_finalized=False
            )
            payrolls.append(payroll)
    Payroll.objects.bulk_create(payrolls)
    print(f"Created {len(payrolls)} payroll records")

    # Calculate Payrolls and Add Deductions
    deductions = []
    for payroll in Payroll.objects.all():
        payroll.calculate_payroll()
        payroll.save()
        if fake.boolean():
            deduction = PayrollDeduction(
                payroll=payroll,
                amount=round(random.uniform(10, 50), 2),
                reason=fake.sentence()[:100]
            )
            deductions.append(deduction)
    PayrollDeduction.objects.bulk_create(deductions)
    print(f"Created {len(deductions)} payroll deductions")

    # Create Tickets (150 tickets)
    tickets = []
    for _ in range(150):
        ticket = Ticket(
            club=random.choice(clubs),
            buyer_name=fake.name()[:100],
            ticket_type=random.choice(['day_pass', 'session']),
            price=round(random.uniform(20.00, 100.00), 2),
            used=fake.boolean(),
            used_by=random.choice(members) if fake.boolean() else None,
            issue_date=fake.date_this_year()
        )
        tickets.append(ticket)
    Ticket.objects.bulk_create(tickets)
    print("Created 150 tickets")

    # Create Receipts (150 entry/exit receipts)
    receipts = []
    for _ in range(150):
        member = random.choice(members)
        entry_log = EntryLog(
            club=member.club,
            member=member,
            approved_by=random.choice(staff_users),
            timestamp=fake.date_time_between(start_date='-1y', end_date='now')
        )
        entry_log.save()
        receipt = Receipt(
            club=member.club,
            member=member,
            entry_log=entry_log,
            date=entry_log.timestamp,
            entry_type=random.choice(['ENTRY', 'EXIT']),
            note=fake.sentence()[:100],
            issued_by=random.choice(staff_users),
            invoice_number=serial_generator("INV", invoice_counter, 5)
        )
        receipts.append(receipt)
        invoice_counter += 1
    Receipt.objects.bulk_create(receipts)
    print("Created 150 entry/exit receipts")

    # Create Entry Logs (200 logs)
    entry_logs = []
    for _ in range(200):
        member = random.choice(members)
        member_subscriptions = [s for s in subscriptions if s.member == member]
        related_subscription = random.choice(member_subscriptions) if member_subscriptions and fake.boolean() else None
        entry_log = EntryLog(
            club=member.club,
            member=member,
            approved_by=random.choice(staff_users),
            related_subscription=related_subscription,
            timestamp=fake.date_time_between(start_date='-1y', end_date='now')
        )
        entry_logs.append(entry_log)
    EntryLog.objects.bulk_create(entry_logs)
    print("Created 200 entry logs")

    # Create Attendance Records (200 records)
    attendance_records = []
    for _ in range(200):
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
        attendance_records.append(attendance)
        subscription.entry_count += 1
        subscriptions_to_update.append(subscription)
    Attendance.objects.bulk_create(attendance_records)
    Subscription.objects.bulk_update(subscriptions_to_update, ['entry_count'])
    print("Created 200 attendance records")

    # Create Shifts (150 shifts)
    shifts = []
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
            approved_by=random.choice(staff_users) if fake.boolean() else None
        )
        shifts.append(shift)
    Shift.objects.bulk_create(shifts)
    print("Created 150 shifts")

    # Create Staff Attendance (100 records)
    staff_attendance_records = []
    for _ in range(100):
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
            club=shift.club,
            shift=shift,
            check_in=check_in,
            check_out=check_out
        )
        staff_attendance_records.append(staff_attendance)
    StaffAttendance.objects.bulk_create(staff_attendance_records)
    print("Created 100 staff attendance records")

    # Create Free Invites (150 invites)
    free_invites = []
    for _ in range(150):
        free_invite = FreeInvite(
            club=random.choice(clubs),
            guest_name=fake.name()[:100],
            phone=fake.phone_number()[:20],
            date=fake.date_this_month(),
            status=random.choice(['pending', 'used']),
            invited_by=random.choice(members) if fake.boolean() else None
        )
        free_invites.append(free_invite)
    FreeInvite.objects.bulk_create(free_invites)
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
    expenses = []
    for _ in range(150):
        expense = Expense(
            club=random.choice(clubs),
            category=random.choice(expense_categories),
            amount=round(random.uniform(50.00, 200.00), 2),
            description=fake.sentence()[:100],
            date=fake.date_this_year(),
            paid_by=random.choice(staff_users),
            invoice_number=serial_generator("INV", invoice_counter, 5)
        )
        expenses.append(expense)
        invoice_counter += 1
    Expense.objects.bulk_create(expenses)
    print("Created 150 expenses")

    # Create Income Sources (3 per club)
    income_sources = []
    for club in clubs:
        for name in ['Membership', 'Tickets', 'Sponsorship']:
            source = IncomeSource(
                club=club,
                name=name,
                description=fake.sentence()[:100]
            )
            income_sources.append(source)
    IncomeSource.objects.bulk_create(income_sources)
    print("Created income sources")

    # Create Incomes (150 incomes)
    incomes = []
    for _ in range(150):
        subscription = random.choice(subscriptions)
        income = Income(
            club=subscription.club,
            source=random.choice(income_sources),
            amount=subscription.paid_amount,
            description=f"Payment for {subscription.member.name}'s subscription",
            date=fake.date_between(start_date=subscription.start_date, end_date=subscription.end_date),
            received_by=random.choice(staff_users)
        )
        incomes.append(income)
    Income.objects.bulk_create(incomes)
    print("Created 150 incomes")

    print("Dummy data created successfully!")

if __name__ == "__main__":
    create_dummy_data()