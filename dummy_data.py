import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()
from datetime import timedelta, datetime
from django.utils import timezone
from django.db.utils import IntegrityError
from faker import Faker
import logging
import random
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

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

    # Create 5 Clubs (increased for diversity)
    clubs = []
    for i in range(5):
        try:
            club = Club.objects.create(
                name=f"Club {fake.company()}"[:50],
                location=fake.address()[:100],
                created_at=timezone.now()
            )
            clubs.append(club)
        except IntegrityError as e:
            logger.error(f"Failed to create club {i+1}: {e}")
            continue
    logger.info(f"Created {len(clubs)} clubs")

    # Create Subscription Types (4 types per club, including private)
    subscription_types = []
    for club in clubs:
        for name, duration, price, gym, pool, classes, max_entries, is_private, private_fee in [
            ('Basic', 30, 100.00, True, False, False, 30, False, None),
            ('Premium', 90, 250.00, True, True, False, 60, False, None),
            ('Elite', 180, 450.00, True, True, True, 90, False, None),
            ('Private Elite', 180, 600.00, True, True, True, 90, True, 150.00),
        ]:
            try:
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
            except IntegrityError as e:
                logger.error(f"Failed to create subscription type {name} for club {club.name}: {e}")
                continue
    logger.info(f"Created {len(subscription_types)} subscription types")

    # Create 2000 Staff Users (600 active, 1400 inactive)
    roles_active = ['owner', 'admin', 'reception']
    roles_inactive = ['coach', 'accountant']
    staff_users = []
    batch_size = 500
    users_to_create = []
    for i in range(2000):
        if i % batch_size == 0 and i > 0:
            logger.info(f"Creating staff users: {i}/2000")
        role = random.choices(
            roles_active + roles_inactive,
            weights=[0.1, 0.1, 0.1, 0.35, 0.35], k=1
        )[0]
        is_active = role in roles_active
        username = None
        email = None
        password = None
        if is_active:
            for _ in range(5):  # Retry up to 5 times
                username = serial_generator("user", user_counter, 8)[:8]
                email = serial_generator("user", user_counter, 8) + "@example.com"
                if username not in unique_usernames and email not in unique_emails and username not in existing_usernames and email not in existing_emails:
                    unique_usernames.add(username)
                    unique_emails.add(email)
                    break
                user_counter += 1
            password = 'pbkdf2_sha256$390000$123456789012$12345678901234567890123456789012'  # Hashed '123'
        for _ in range(5):
            rfid = serial_generator("RFID", rfid_counter, 8)
            if rfid not in unique_rfids and rfid not in existing_rfids:
                unique_rfids.add(rfid)
                break
            rfid_counter += 1
        else:
            logger.warning(f"Could not generate unique rfid_code for user {i+1}")
            continue
        user = User(
            username=username,
            email=email,
            password=password,
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
        if len(users_to_create) >= batch_size:
            try:
                User.objects.bulk_create(users_to_create, ignore_conflicts=True)
                staff_users.extend(User.objects.filter(rfid_code__in=[u.rfid_code for u in users_to_create]).all())
                users_to_create = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of users: {e}")
                users_to_create = []
    if users_to_create:
        try:
            User.objects.bulk_create(users_to_create, ignore_conflicts=True)
            staff_users.extend(User.objects.filter(rfid_code__in=[u.rfid_code for u in users_to_create]).all())
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of users: {e}")
    logger.info(f"Created {len(staff_users)} staff users (~600 active, ~1400 inactive)")

    # Create Employee Contracts for Coaches and Accountants (1400 contracts)
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
        if len(employee_contracts) >= batch_size:
            try:
                EmployeeContract.objects.bulk_create(employee_contracts, ignore_conflicts=True)
                employee_contracts = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of employee contracts: {e}")
                employee_contracts = []
    if employee_contracts:
        try:
            EmployeeContract.objects.bulk_create(employee_contracts, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of employee contracts: {e}")
    logger.info(f"Created {len(employee_contracts)} employee contracts")

    # Create Coach Percentages for Coaches (~700 percentages)
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
        if len(coach_percentages) >= batch_size:
            try:
                CoachPercentage.objects.bulk_create(coach_percentages, ignore_conflicts=True)
                coach_percentages = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of coach percentages: {e}")
                coach_percentages = []
    if coach_percentages:
        try:
            CoachPercentage.objects.bulk_create(coach_percentages, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of coach percentages: {e}")
    logger.info(f"Created {len(coach_percentages)} coach percentages")

    # Create 6000 Members
    members = []
    for i in range(6000):
        if i % 1000 == 0:
            logger.info(f"Creating members: {i}/6000")
        for _ in range(5):
            national_id = serial_generator("NAT", member_counter, 14)
            if national_id not in unique_national_ids:
                unique_national_ids.add(national_id)
                break
            member_counter += 1
        else:
            logger.warning(f"Could not generate unique national_id for member {i+1}")
            continue
        for _ in range(5):
            rfid = serial_generator("RFID", rfid_counter, 10)
            if rfid not in unique_rfids and rfid not in existing_rfids:
                unique_rfids.add(rfid)
                break
            rfid_counter += 1
        else:
            logger.warning(f"Could not generate unique rfid_code for member {i+1}")
            continue
        for _ in range(5):
            try:
                membership_number = generate_membership_number(created_at=fake.date_time_this_year())
                if membership_number not in existing_membership_numbers:
                    existing_membership_numbers.add(membership_number)
                    break
            except ValueError:
                continue
        else:
            logger.warning(f"Could not generate unique membership_number for member {i+1}")
            continue
        club = random.choices(clubs, weights=[0.3, 0.25, 0.2, 0.15, 0.1])[0]
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
            logger.error(f"Skipped member {i+1} due to error: {e}")
            continue
        member_counter += 1
        rfid_counter += 1
    logger.info(f"Created {len(members)} members")

    # Update Referrals (10% of members, ~600)
    referral_count = max(2000, int(len(members) * 0.1))
    for member in random.sample(members, min(referral_count, len(members))):
        possible_referrers = [m for m in members if m != member and m.club == member.club]
        if possible_referrers:
            member.referred_by = random.choice(possible_referrers)
            member.save()
    logger.info("Assigned referrals")

    # Create Subscriptions (1–3 per member, ~12000 total)
    subscriptions = []
    subscriptions_to_create = []
    subscriptions_to_update = []
    coaches = [u for u in staff_users if u.role == 'coach']
    for i, member in enumerate(members):
        if i % 1000 == 0:
            logger.info(f"Creating subscriptions: {i}/{len(members)}")
        num_subscriptions = random.randint(1, 3)
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
        if len(subscriptions_to_create) >= batch_size:
            try:
                Subscription.objects.bulk_create(subscriptions_to_create, ignore_conflicts=True)
                subscriptions_to_create = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of subscriptions: {e}")
                subscriptions_to_create = []
    if subscriptions_to_create:
        try:
            Subscription.objects.bulk_create(subscriptions_to_create, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of subscriptions: {e}")
    logger.info(f"Created {len(subscriptions)} subscriptions")

    # Create Private Subscription Payments (~3000 for private subscriptions)
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
        if len(private_payments) >= batch_size:
            try:
                PrivateSubscriptionPayment.objects.bulk_create(private_payments, ignore_conflicts=True)
                private_payments = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of private payments: {e}")
                private_payments = []
    if private_payments:
        try:
            PrivateSubscriptionPayment.objects.bulk_create(private_payments, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of private payments: {e}")
    logger.info(f"Created {len(private_payments)} private subscription payments")

    # Create Payroll Periods (5 periods per club, ~25 total)
    payroll_periods = []
    for club in clubs:
        for i in range(5):
            start_date = fake.date_between(start_date='-6m', end_date='today')
            end_date = start_date + timedelta(days=30)
            period = PayrollPeriod(
                club=club,
                start_date=start_date,
                end_date=end_date,
                is_active=i == 0  # Only the latest period is active
            )
            payroll_periods.append(period)
    try:
        PayrollPeriod.objects.bulk_create(payroll_periods, ignore_conflicts=True)
    except IntegrityError as e:
        logger.error(f"Failed to create payroll periods: {e}")
    logger.info(f"Created {len(payroll_periods)} payroll periods")

    # Create Payroll Records (~10000 total)
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
        if len(payrolls) >= batch_size:
            try:
                Payroll.objects.bulk_create(payrolls, ignore_conflicts=True)
                payrolls = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of payrolls: {e}")
                payrolls = []
    if payrolls:
        try:
            Payroll.objects.bulk_create(payrolls, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of payrolls: {e}")
    logger.info(f"Created {len(payrolls)} payroll records")

    # Calculate Payrolls and Add Deductions (~5000 deductions)
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
        if len(deductions) >= batch_size:
            try:
                PayrollDeduction.objects.bulk_create(deductions, ignore_conflicts=True)
                deductions = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of deductions: {e}")
                deductions = []
    if deductions:
        try:
            PayrollDeduction.objects.bulk_create(deductions, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of deductions: {e}")
    logger.info(f"Created {len(deductions)} payroll deductions")

    # Create Tickets (2000 tickets)
    tickets = []
    for i in range(2000):
        if i % 1000 == 0:
            logger.info(f"Creating tickets: {i}/2000")
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
        if len(tickets) >= batch_size:
            try:
                Ticket.objects.bulk_create(tickets, ignore_conflicts=True)
                tickets = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of tickets: {e}")
                tickets = []
    if tickets:
        try:
            Ticket.objects.bulk_create(tickets, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of tickets: {e}")
    logger.info(f"Created {len(tickets)} tickets")

    # Create Receipts (6000 entry/exit receipts)
    receipts = []
    for i in range(6000):
        if i % 1000 == 0:
            logger.info(f"Creating receipts: {i}/6000")
        member = random.choice(members)
        entry_log = EntryLog(
            club=member.club,
            member=member,
            approved_by=random.choice(staff_users),
            timestamp=fake.date_time_between(start_date='-1y', end_date='now')
        )
        try:
            entry_log.save()
        except IntegrityError as e:
            logger.error(f"Failed to create entry log for receipt {i+1}: {e}")
            continue
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
        if len(receipts) >= batch_size:
            try:
                Receipt.objects.bulk_create(receipts, ignore_conflicts=True)
                receipts = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of receipts: {e}")
                receipts = []
    if receipts:
        try:
            Receipt.objects.bulk_create(receipts, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of receipts: {e}")
    logger.info(f"Created {len(receipts)} entry/exit receipts")

    # Create Entry Logs (6000 logs)
    entry_logs = []
    for i in range(6000):
        if i % 1000 == 0:
            logger.info(f"Creating entry logs: {i}/6000")
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
        if len(entry_logs) >= batch_size:
            try:
                EntryLog.objects.bulk_create(entry_logs, ignore_conflicts=True)
                entry_logs = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of entry logs: {e}")
                entry_logs = []
    if entry_logs:
        try:
            EntryLog.objects.bulk_create(entry_logs, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of entry logs: {e}")
    logger.info(f"Created {len(entry_logs)} entry logs")

    # Create Attendance Records (6000 records)
    attendance_records = []
    for i in range(6000):
        if i % 1000 == 0:
            logger.info(f"Creating attendance records: {i}/6000")
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
        if len(attendance_records) >= batch_size:
            try:
                Attendance.objects.bulk_create(attendance_records, ignore_conflicts=True)
                attendance_records = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of attendance records: {e}")
                attendance_records = []
    if attendance_records:
        try:
            Attendance.objects.bulk_create(attendance_records, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of attendance records: {e}")
    Subscription.objects.bulk_update(subscriptions_to_update, ['entry_count'])
    logger.info(f"Created {len(attendance_records)} attendance records")

    # Create Shifts (4000 shifts)
    shifts = []
    for i in range(4000):
        if i % 1000 == 0:
            logger.info(f"Creating shifts: {i}/4000")
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
        if len(shifts) >= batch_size:
            try:
                Shift.objects.bulk_create(shifts, ignore_conflicts=True)
                shifts = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of shifts: {e}")
                shifts = []
    if shifts:
        try:
            Shift.objects.bulk_create(shifts, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of shifts: {e}")
    logger.info(f"Created {len(shifts)} shifts")

    # Create Staff Attendance (3000 records)
    staff_attendance_records = []
    for i in range(3000):
        if i % 1000 == 0:
            logger.info(f"Creating staff attendance records: {i}/3000")
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
        if len(staff_attendance_records) >= batch_size:
            try:
                StaffAttendance.objects.bulk_create(staff_attendance_records, ignore_conflicts=True)
                staff_attendance_records = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of staff attendance records: {e}")
                staff_attendance_records = []
    if staff_attendance_records:
        try:
            StaffAttendance.objects.bulk_create(staff_attendance_records, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of staff attendance records: {e}")
    logger.info(f"Created {len(staff_attendance_records)} staff attendance records")

    # Create Free Invites (2000 invites)
    free_invites = []
    for i in range(2000):
        if i % 1000 == 0:
            logger.info(f"Creating free invites: {i}/2000")
        free_invite = FreeInvite(
            club=random.choice(clubs),
            guest_name=fake.name()[:100],
            phone=fake.phone_number()[:20],
            date=fake.date_this_month(),
            status=random.choice(['pending', 'used']),
            invited_by=random.choice(members) if fake.boolean() else None
        )
        free_invites.append(free_invite)
        if len(free_invites) >= batch_size:
            try:
                FreeInvite.objects.bulk_create(free_invites, ignore_conflicts=True)
                free_invites = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of free invites: {e}")
                free_invites = []
    if free_invites:
        try:
            FreeInvite.objects.bulk_create(free_invites, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of free invites: {e}")
    logger.info(f"Created {len(free_invites)} free invites")

    # Create Expense Categories (3 per club, ~15 total)
    expense_categories = []
    for club in clubs:
        for name in ['Utilities', 'Maintenance', 'Supplies']:
            category = ExpenseCategory(
                club=club,
                name=name,
                description=fake.sentence()[:100]
            )
            expense_categories.append(category)
    try:
        ExpenseCategory.objects.bulk_create(expense_categories, ignore_conflicts=True)
    except IntegrityError as e:
        logger.error(f"Failed to create expense categories: {e}")
    logger.info(f"Created {len(expense_categories)} expense categories")

    # Create Expenses (3000 expenses)
    expenses = []
    for i in range(3000):
        if i % 1000 == 0:
            logger.info(f"Creating expenses: {i}/3000")
        expense = Expense(
            club=random.choice(clubs),
            category=random.choice(expense_categories),
            amount=round(random.uniform(50.00, 1000.00), 2),
            description=fake.sentence()[:100],
            date=fake.date_this_year(),
            paid_by=random.choice(staff_users),
            invoice_number=serial_generator("INV", invoice_counter, 5)
        )
        expenses.append(expense)
        invoice_counter += 1
        if len(expenses) >= batch_size:
            try:
                Expense.objects.bulk_create(expenses, ignore_conflicts=True)
                expenses = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of expenses: {e}")
                expenses = []
    if expenses:
        try:
            Expense.objects.bulk_create(expenses, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of expenses: {e}")
    logger.info(f"Created {len(expenses)} expenses")

    # Create Income Sources (3 per club, ~15 total)
    income_sources = []
    for club in clubs:
        for name in ['Membership', 'Tickets', 'Sponsorship']:
            source = IncomeSource(
                club=club,
                name=name,
                description=fake.sentence()[:100]
            )
            income_sources.append(source)
    try:
        IncomeSource.objects.bulk_create(income_sources, ignore_conflicts=True)
    except IntegrityError as e:
        logger.error(f"Failed to create income sources: {e}")
    logger.info(f"Created {len(income_sources)} income sources")

    # Create Incomes (3000 incomes)
    incomes = []
    for i in range(3000):
        if i % 1000 == 0:
            logger.info(f"Creating incomes: {i}/3000")
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
        if len(incomes) >= batch_size:
            try:
                Income.objects.bulk_create(incomes, ignore_conflicts=True)
                incomes = []
            except IntegrityError as e:
                logger.error(f"Failed to create batch of incomes: {e}")
                incomes = []
    if incomes:
        try:
            Income.objects.bulk_create(incomes, ignore_conflicts=True)
        except IntegrityError as e:
            logger.error(f"Failed to create final batch of incomes: {e}")
    logger.info(f"Created {len(incomes)} incomes")

    logger.info("Dummy data created successfully!")

if __name__ == "__main__":
    create_dummy_data()