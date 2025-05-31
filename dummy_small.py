import os ,django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

import time
import logging
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
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configurable Parameters
NUM_CLUBS = 1
NUM_MEMBERS = 200
NUM_STAFF = 20
NUM_TICKETS = 150
NUM_RECEIPTS = 10
NUM_ENTRY_LOGS = 200
NUM_ATTENDANCE_RECORDS = 200
NUM_SHIFTS = 150
NUM_STAFF_ATTENDANCE = 100
NUM_FREE_INVITES = 150
NUM_EXPENSES = 150
NUM_INCOMES = 150
NUM_SUBSCRIPTION_TYPES_PER_CLUB = 3
NUM_PAYROLL_PERIODS_PER_CLUB = 3

fake = Faker()

# Utility Functions
def serial_generator(prefix, counter, length=8):
    """Generate unique serial numbers with a prefix."""
    return f"{prefix}{str(counter).zfill(length)}"

def initialize_counters():
    """Initialize counters and sets for unique fields."""
    return {
        'user_counter': 10000000,
        'member_counter': 10000000,
        'invoice_counter': 1000,
        'unique_usernames': set(User.objects.filter(username__isnull=False).values_list('username', flat=True)),
        'unique_emails': set(User.objects.filter(email__isnull=False).values_list('email', flat=True)),
        'unique_national_ids': set(),
        'unique_rfids': set(User.objects.filter(rfid_code__isnull=False).values_list('rfid_code', flat=True)).union(
            set(Member.objects.filter(rfid_code__isnull=False).values_list('rfid_code', flat=True))
        ),
        'existing_membership_numbers': set(Member.objects.filter(membership_number__isnull=False).values_list('membership_number', flat=True))
    }

# Data Creation Functions
def create_clubs(counters):
    """Create clubs if they don't exist."""
    if Club.objects.count() >= NUM_CLUBS:
        logger.info(f"Skipping clubs creation: {Club.objects.count()} clubs already exist")
        return Club.objects.all()[:NUM_CLUBS]
    
    start_time = time.time()
    clubs = []
    for i in range(NUM_CLUBS):
        club = Club.objects.create(
            name=f"Club {fake.company()}"[:50],
            location=fake.address()[:100],
            created_at=timezone.now()
        )
        clubs.append(club)
    logger.info(f"Created {len(clubs)} clubs in {time.time() - start_time:.2f} seconds")
    return clubs

def create_subscription_types(clubs):
    """Create subscription types for each club."""
    if SubscriptionType.objects.count() >= NUM_CLUBS * NUM_SUBSCRIPTION_TYPES_PER_CLUB:
        logger.info(f"Skipping subscription types creation: {SubscriptionType.objects.count()} types exist")
        return SubscriptionType.objects.all()
    
    start_time = time.time()
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
    logger.info(f"Created {len(subscription_types)} subscription types in {time.time() - start_time:.2f} seconds")
    return subscription_types

def create_staff(counters, clubs):
    """Create staff users."""
    if User.objects.count() >= NUM_STAFF:
        logger.info(f"Skipping staff creation: {User.objects.count()} staff exist")
        return User.objects.all()[:NUM_STAFF]
    
    start_time = time.time()
    roles_active = ['owner', 'admin', 'reception']
    roles_inactive = ['coach', 'accountant']
    staff_users = []
    users_to_create = []
    
    for _ in range(NUM_STAFF):
        role = random.choices(
            roles_active + roles_inactive,
            weights=[0.1, 0.1, 0.1, 0.35, 0.35], k=1
        )[0]
        is_active = role in roles_active
        
        while True:
            username = serial_generator("user", counters['user_counter'], 8)[:8]
            email = serial_generator("user", counters['user_counter'], 8) + "@example.com"
            if username not in counters['unique_usernames'] and email not in counters['unique_emails']:
                counters['unique_usernames'].add(username)
                counters['unique_emails'].add(email)
                break
            counters['user_counter'] += 1
        
        while True:
            rfid = str(uuid.uuid4())[:10]
            if rfid not in counters['unique_rfids']:
                counters['unique_rfids'].add(rfid)
                break
        
        user = User(
            username=username,
            email=email,
            password='pbkdf2_sha256$390000$123456789012$12345678901234567890123456789012',
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
        counters['user_counter'] += 1
    
    User.objects.bulk_create(users_to_create)
    staff_users = User.objects.filter(rfid_code__in=[u.rfid_code for u in users_to_create]).all()
    logger.info(f"Created {len(staff_users)} staff users in {time.time() - start_time:.2f} seconds")
    return staff_users
def create_members(counters, clubs):
    """Create members."""
    if Member.objects.count() >= NUM_MEMBERS:
        logger.info(f"Skipping members creation: {Member.objects.count()} members exist")
        return Member.objects.all()[:NUM_MEMBERS]
    
    start_time = time.time()
    members = []
    
    if len(clubs) == 1:
        weights = [1.0]  
    else:
        weights = [1.0 / len(clubs)] * len(clubs)  
    
    for i in range(NUM_MEMBERS):
        while True:
            national_id = serial_generator("NAT", counters['member_counter'], 14)
            if national_id not in counters['unique_national_ids']:
                counters['unique_national_ids'].add(national_id)
                break
            counters['member_counter'] += 1
        
        while True:
            rfid = str(uuid.uuid4())[:10]
            if rfid not in counters['unique_rfids']:
                counters['unique_rfids'].add(rfid)
                break
        
        while True:
            try:
                membership_number = generate_membership_number(created_at=fake.date_time_this_year())
                if membership_number not in counters['existing_membership_numbers']:
                    counters['existing_membership_numbers'].add(membership_number)
                    break
            except ValueError:
                continue
        
        club = random.choices(clubs, weights=weights)[0]
        
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
            logger.warning(f"Skipped member due to error: {e}")
            continue
        counters['member_counter'] += 1
        if i % 50 == 0:
            logger.info(f"Creating members: {i}/{NUM_MEMBERS}")
    
    # Assign referrals
    for member in random.sample(members, min(20, len(members))):
        possible_referrers = [m for m in members if m != member and m.club == member.club]
        if possible_referrers:
            member.referred_by = random.choice(possible_referrers)
            member.save()
    
    logger.info(f"Created {len(members)} members in {time.time() - start_time:.2f} seconds")
    return members

def create_subscriptions(members, subscription_types, staff_users):
    """Create subscriptions with logical coach assignment."""
    if Subscription.objects.count() >= NUM_MEMBERS:  # Assuming at least 1 subscription per member
        logger.info(f"Skipping subscriptions creation: {Subscription.objects.count()} subscriptions exist")
        return Subscription.objects.all()
    
    start_time = time.time()
    subscriptions = []
    subscriptions_to_create = []
    coaches = [u for u in staff_users if u.role == 'coach']
    
    for i, member in enumerate(members):
        num_subscriptions = random.randint(1, 2)
        club_sub_types = [st for st in subscription_types if st.club == member.club]
        selected_types = random.sample(club_sub_types, min(num_subscriptions, len(club_sub_types)))
        
        for sub_type in selected_types:
            start_date = fake.date_between(start_date='-6m', end_date='today')
            end_date = start_date + timedelta(days=sub_type.duration_days)
            max_entries = sub_type.max_entries
            entry_count = random.randint(0, max_entries) if max_entries > 0 else 0
            # Ensure coach is from the same club
            club_coaches = [c for c in coaches if c.club == member.club]
            coach = random.choice(club_coaches) if sub_type.is_private and club_coaches else None
            
            subscription = Subscription(
                club=member.club,
                member=member,
                type=sub_type,
                coach=coach,
                start_date=start_date,
                end_date=end_date,
                paid_amount=sub_type.price,
                remaining_amount=0,
                entry_count=entry_count
            )
            subscriptions_to_create.append(subscription)
            subscriptions.append(subscription)
        if i % 50 == 0:
            logger.info(f"Creating subscriptions: {i}/{len(members)}")
    
    Subscription.objects.bulk_create(subscriptions_to_create)
    logger.info(f"Created {len(subscriptions)} subscriptions in {time.time() - start_time:.2f} seconds")
    return subscriptions

def create_payroll_periods(clubs):
    """Create payroll periods with valid dates."""
    if PayrollPeriod.objects.count() >= NUM_CLUBS * NUM_PAYROLL_PERIODS_PER_CLUB:
        logger.info(f"Skipping payroll periods creation: {PayrollPeriod.objects.count()} periods exist")
        return PayrollPeriod.objects.all()
    
    start_time = time.time()
    payroll_periods = []
    used_start_dates = {club.id: set() for club in clubs}
    
    for club in clubs:
        for i in range(NUM_PAYROLL_PERIODS_PER_CLUB):
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
                is_active=i == 0
            )
            payroll_periods.append(period)
        PayrollPeriod.objects.bulk_create(payroll_periods)
        payroll_periods = []
    
    logger.info(f"Created payroll periods in {time.time() - start_time:.2f} seconds")
    return PayrollPeriod.objects.all()

def create_payrolls(staff_users, payroll_periods):
    """Create payrolls ensuring valid employment periods."""
    if Payroll.objects.count() >= len(staff_users) * NUM_PAYROLL_PERIODS_PER_CLUB:
        logger.info(f"Skipping payrolls creation: {Payroll.objects.count()} payrolls exist")
        return Payroll.objects.all()
    
    start_time = time.time()
    payrolls = []
    
    for period in payroll_periods:
        for user in staff_users:
            if user.club != period.club:
                continue
            # Check if user was employed during the period
            contract = EmployeeContract.objects.filter(employee=user, start_date__lte=period.end_date).first()
            if not contract or (contract.end_date and contract.end_date < period.start_date):
                continue
            
            payroll = Payroll(
                employee=user,
                club=period.club,
                period=period,
                expected_hours=random.randint(100, 200) if user.role in ['coach', 'accountant'] else 0,
                actual_hours=0,
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
        payrolls = []
    
    # Calculate payrolls in batches
    batch_size = 50
    payrolls = Payroll.objects.all()
    for i in range(0, len(payrolls), batch_size):
        batch = payrolls[i:i + batch_size]
        for payroll in batch:
            payroll.calculate_payroll()
            payroll.save()
    
    logger.info(f"Created and calculated payrolls in {time.time() - start_time:.2f} seconds")
    return Payroll.objects.all()

def create_dummy_data(only_members=False):
    """Main function to create dummy data with partial run support."""
    total_start_time = time.time()
    counters = initialize_counters()
    
    # Create foundational data
    clubs = create_clubs(counters)
    subscription_types = create_subscription_types(clubs) if not only_members else SubscriptionType.objects.all()
    staff_users = create_staff(counters, clubs) if not only_members else User.objects.all()
    
    # Create members
    members = create_members(counters, clubs)
    
    if only_members:
        logger.info(f"Completed partial run (only members) in {time.time() - total_start_time:.2f} seconds")
        return
    
    # Create remaining data
    subscriptions = create_subscriptions(members, subscription_types, staff_users)
    payroll_periods = create_payroll_periods(clubs)
    payrolls = create_payrolls(staff_users, payroll_periods)
    
    # Add other data creation functions as needed (tickets, receipts, etc.)
    # Example for tickets
    if Ticket.objects.count() < NUM_TICKETS:
        start_time = time.time()
        tickets = [
            Ticket(
                club=random.choice(clubs),
                buyer_name=fake.name()[:100],
                ticket_type=random.choice(['day_pass', 'session']),
                price=round(random.uniform(20.00, 100.00), 2),
                used=fake.boolean(),
                used_by=random.choice(members) if fake.boolean() else None,
                issue_date=fake.date_this_year()
            ) for _ in range(NUM_TICKETS - Ticket.objects.count())
        ]
        Ticket.objects.bulk_create(tickets)
        logger.info(f"Created {len(tickets)} tickets in {time.time() - start_time:.2f} seconds")
    
    logger.info(f"Completed full dummy data creation in {time.time() - total_start_time:.2f} seconds")

if __name__ == "__main__":
    create_dummy_data(only_members=False)