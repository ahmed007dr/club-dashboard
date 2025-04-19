import os , django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

import random
from datetime import datetime, timedelta
from django.core.files import File
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from faker import Faker
from core.models import Club, User
from members.models import Member
from subscriptions.models import SubscriptionType, Subscription
from tickets.models import Ticket
from receipts.models import Receipt
from attendance.models import EntryLog
from staff.models import Shift
from invites.models import FreeInvite
from finance.models import ExpenseCategory, Expense, IncomeSource, Income

fake = Faker()

class Command(BaseCommand):
    help = 'Generates dummy data for the club management system'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to generate dummy data...'))
        
        # Create clubs
        clubs = self.create_clubs()
        
        # Create users for each club
        users = self.create_users(clubs)
        
        # Create members
        members = self.create_members(clubs)
        
        # Create subscription types
        subscription_types = self.create_subscription_types(clubs)
        
        # Create subscriptions
        subscriptions = self.create_subscriptions(clubs, members, subscription_types)
        
        # Create tickets
        tickets = self.create_tickets(clubs, members)
        
        # Create receipts
        receipts = self.create_receipts(clubs, members, subscriptions, users)
        
        # Create entry logs
        entry_logs = self.create_entry_logs(clubs, members, subscriptions, users)
        
        # Create shifts
        shifts = self.create_shifts(clubs, users)
        
        # Create free invites
        free_invites = self.create_free_invites(clubs, members, users)
        
        # Create finance data
        self.create_finance_data(clubs, users, receipts)
        
        self.stdout.write(self.style.SUCCESS('Successfully generated dummy data!'))

    def create_clubs(self):
        clubs = []
        club_names = ['Elite Fitness', 'Power Gym', 'Olympic Sports Club', 'Royal Health Club']
        
        for name in club_names:
            club = Club.objects.create(
                name=name,
                location=fake.address(),
                created_at=fake.date_time_this_year()
            )
            clubs.append(club)
            self.stdout.write(self.style.SUCCESS(f'Created club: {name}'))
        
        return clubs

    def create_users(self, clubs):
        users = []
        roles = ['admin', 'reception', 'accountant', 'coach']
        
        for club in clubs:
            # Create admin user
            admin = User.objects.create(
                username=f"admin_{club.name.lower().replace(' ', '_')}",
                email=f"admin@{club.name.lower().replace(' ', '_')}.com",
                password=make_password('admin123'),
                club=club,
                role='admin',
                first_name=fake.first_name(),
                last_name=fake.last_name()
            )
            users.append(admin)
            
            # Create other staff users
            for role in roles[1:]:  # Skip admin as we already created one
                for i in range(2):  # Create 2 users for each role
                    user = User.objects.create(
                        username=f"{role}_{i}_{club.name.lower().replace(' ', '_')}",
                        email=f"{role}{i}@{club.name.lower().replace(' ', '_')}.com",
                        password=make_password(f"{role}123"),
                        club=club,
                        role=role,
                        first_name=fake.first_name(),
                        last_name=fake.last_name()
                    )
                    users.append(user)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(users)} users'))
        return users

    def create_members(self, clubs):
        members = []
        
        for club in clubs:
            # Create 20-30 members per club
            for _ in range(random.randint(20, 30)):
                member = Member.objects.create(
                    club=club,
                    name=fake.name(),
                    membership_number=fake.unique.bothify(text='M-#####'),
                    national_id=fake.unique.bothify(text='##############'),
                    birth_date=fake.date_of_birth(minimum_age=18, maximum_age=70),
                    phone=fake.phone_number(),
                    created_at=fake.date_time_this_year()
                )
                
                # 30% chance to have a referral
                if random.random() < 0.3 and members:
                    member.referred_by = random.choice([m for m in members if m.club == club])
                    member.save()
                
                members.append(member)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(members)} members'))
        return members

    def create_subscription_types(self, clubs):
        subscription_types = []
        type_names = [
            ('Basic', 30, 500, False, False, True),
            ('Standard', 90, 1200, True, False, True),
            ('Premium', 180, 2000, True, True, True),
            ('VIP', 365, 3500, True, True, True),
            ('Pool Only', 30, 300, False, True, False),
            ('Gym Only', 30, 400, True, False, False)
        ]
        
        for club in clubs:
            for name, duration, price, gym, pool, classes in type_names:
                subscription_type = SubscriptionType.objects.create(
                    club=club,
                    name=f"{name} ({club.name})",
                    duration_days=duration,
                    price=price,
                    includes_gym=gym,
                    includes_pool=pool,
                    includes_classes=classes
                )
                subscription_types.append(subscription_type)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(subscription_types)} subscription types'))
        return subscription_types

    def create_subscriptions(self, clubs, members, subscription_types):
        subscriptions = []
        
        for member in members:
            # Each member has 1-3 subscriptions
            for _ in range(random.randint(1, 3)):
                # Get subscription types for this member's club
                club_types = [st for st in subscription_types if st.club == member.club]
                if not club_types:
                    continue
                
                sub_type = random.choice(club_types)
                start_date = fake.date_between(start_date='-1y', end_date='today')
                end_date = start_date + timedelta(days=sub_type.duration_days)
                
                # Create subscription
                subscription = Subscription.objects.create(
                    club=member.club,
                    member=member,
                    type=sub_type,
                    start_date=start_date,
                    end_date=end_date,
                    paid_amount=sub_type.price * random.uniform(0.8, 1.0),  # 80-100% of price
                    remaining_amount=max(0, sub_type.price * random.uniform(0, 0.2)),  # 0-20% remaining
                    attendance_days=random.randint(0, sub_type.duration_days)
                )
                subscriptions.append(subscription)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(subscriptions)} subscriptions'))
        return subscriptions

    def create_tickets(self, clubs, members):
        tickets = []
        
        for club in clubs:
            # Create 10-20 tickets per club
            for _ in range(random.randint(10, 20)):
                ticket_type = random.choice(['day_pass', 'session'])
                price = 100 if ticket_type == 'day_pass' else 50
                
                # 50% chance the ticket is used by a member
                used_by = random.choice(members) if random.random() < 0.5 and members else None
                
                ticket = Ticket.objects.create(
                    club=club,
                    buyer_name=fake.name(),
                    ticket_type=ticket_type,
                    price=price,
                    used=used_by is not None,
                    used_by=used_by,
                    issue_date=fake.date_this_year()
                )
                tickets.append(ticket)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(tickets)} tickets'))
        return tickets

    def create_receipts(self, clubs, members, subscriptions, users):
        receipts = []
        
        for club in clubs:
            club_members = [m for m in members if m.club == club]
            club_users = [u for u in users if u.club == club]
            club_subs = [s for s in subscriptions if s.club == club]
            
            # Create 20-30 receipts per club
            for _ in range(random.randint(20, 30)):
                member = random.choice(club_members)
                user = random.choice(club_users)
                
                # 70% chance it's for a subscription
                if random.random() < 0.7 and club_subs:
                    member_subs = [s for s in club_subs if s.member == member]
                    subscription = random.choice(member_subs) if member_subs else None
                    amount = subscription.paid_amount if subscription else random.randint(300, 3000)
                else:
                    subscription = None
                    amount = random.randint(100, 1000)
                
                receipt = Receipt.objects.create(
                    club=club,
                    member=member,
                    subscription=subscription,
                    amount=amount,
                    payment_method=random.choice(['cash', 'visa', 'bank']),
                    issued_by=user,
                    note=fake.sentence() if random.random() < 0.5 else None
                )
                receipts.append(receipt)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(receipts)} receipts'))
        return receipts

    def create_entry_logs(self, clubs, members, subscriptions, users):
        entry_logs = []
        
        for club in clubs:
            club_members = [m for m in members if m.club == club]
            club_users = [u for u in users if u.club == club]
            club_subs = [s for s in subscriptions if s.club == club]
            
            # Create 50-100 entry logs per club
            for _ in range(random.randint(50, 100)):
                member = random.choice(club_members)
                user = random.choice(club_users)
                
                # Get active subscriptions for this member
                member_subs = [s for s in club_subs if s.member == member and s.start_date <= datetime.now().date() <= s.end_date]
                subscription = random.choice(member_subs) if member_subs else None
                
                entry_log = EntryLog.objects.create(
                    club=club,
                    member=member,
                    approved_by=user,
                    related_subscription=subscription,
                    timestamp=fake.date_time_this_year()
                )
                entry_logs.append(entry_log)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(entry_logs)} entry logs'))
        return entry_logs

    def create_shifts(self, clubs, users):
        shifts = []
        
        for club in clubs:
            club_users = [u for u in users if u.club == club and u.role in ['reception', 'coach']]
            admin_users = [u for u in users if u.club == club and u.role == 'admin']
            
            # Create shifts for the past 30 days
            for i in range(30):
                date = datetime.now().date() - timedelta(days=30 - i)
                
                for user in club_users:
                    # 80% chance to have a shift on this day
                    if random.random() < 0.8:
                        shift_start = fake.time_object(end_datetime=None)
                        shift_end = (datetime.combine(date, shift_start) + timedelta(hours=8)).time()
                        
                        shift = Shift.objects.create(
                            club=club,
                            staff=user,
                            date=date,
                            shift_start=shift_start,
                            shift_end=shift_end,
                            approved_by=random.choice(admin_users) if admin_users and random.random() < 0.7 else None
                        )
                        shifts.append(shift)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(shifts)} shifts'))
        return shifts

    def create_free_invites(self, clubs, members, users):
        free_invites = []
        
        for club in clubs:
            club_members = [m for m in members if m.club == club]
            club_users = [u for u in users if u.club == club]
            
            # Create 5-10 free invites per club
            for _ in range(random.randint(5, 10)):
                free_invite = FreeInvite.objects.create(
                    club=club,
                    guest_name=fake.name(),
                    phone=fake.phone_number(),
                    date=fake.date_this_year(),
                    status=random.choice(['pending', 'used']),
                    invited_by=random.choice(club_members) if club_members and random.random() < 0.7 else None,
                    handled_by=random.choice(club_users) if random.random() < 0.5 else None
                )
                free_invites.append(free_invite)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(free_invites)} free invites'))
        return free_invites

    def create_finance_data(self, clubs, users, receipts):
        # Create expense categories
        expense_categories = []
        category_names = [
            'Rent', 'Utilities', 'Salaries', 'Equipment', 
            'Maintenance', 'Cleaning', 'Marketing', 'Insurance'
        ]
        
        for club in clubs:
            for name in category_names:
                category = ExpenseCategory.objects.create(
                    club=club,
                    name=f"{name} ({club.name})",
                    description=fake.sentence()
                )
                expense_categories.append(category)
        
        # Create expenses
        expenses = []
        for club in clubs:
            club_categories = [ec for ec in expense_categories if ec.club == club]
            club_users = [u for u in users if u.club == club]
            
            # Create 15-25 expenses per club
            for _ in range(random.randint(15, 25)):
                expense = Expense.objects.create(
                    club=club,
                    category=random.choice(club_categories),
                    amount=random.randint(100, 5000),
                    description=fake.sentence(),
                    date=fake.date_this_year(),
                    paid_by=random.choice(club_users),
                    invoice_number=fake.bothify(text='INV-#####')
                )
                expenses.append(expense)
        
        # Create income sources
        income_sources = []
        source_names = [
            'Subscription Payments', 'Personal Training', 
            'Merchandise Sales', 'Cafe Sales', 'Event Tickets'
        ]
        
        for club in clubs:
            for name in source_names:
                source = IncomeSource.objects.create(
                    club=club,
                    name=f"{name} ({club.name})",
                    description=fake.sentence()
                )
                income_sources.append(source)
        
        # Create incomes (some from receipts, some standalone)
        incomes = []
        for club in clubs:
            club_sources = [isrc for isrc in income_sources if isrc.club == club]
            club_users = [u for u in users if u.club == club]
            club_receipts = [r for r in receipts if r.club == club]
            
            # Create incomes from receipts
            for receipt in club_receipts:
                source_name = 'Subscription Payments' if receipt.subscription else 'General Payments'
                source = next((s for s in club_sources if source_name in s.name), None)
                
                if source:
                    income = Income.objects.create(
                        club=club,
                        source=source,
                        amount=receipt.amount,
                        description=f"Payment from {receipt.member.name}",
                        date=receipt.date.date(),
                        received_by=receipt.issued_by,
                        related_receipt=receipt
                    )
                    incomes.append(income)
            
            # Create some standalone incomes
            for _ in range(random.randint(5, 10)):
                source = random.choice(club_sources)
                income = Income.objects.create(
                    club=club,
                    source=source,
                    amount=random.randint(50, 2000),
                    description=fake.sentence(),
                    date=fake.date_this_year(),
                    received_by=random.choice(club_users)
                )
                incomes.append(income)
        
        self.stdout.write(self.style.SUCCESS(
            f'Created finance data: {len(expense_categories)} categories, '
            f'{len(expenses)} expenses, {len(income_sources)} sources, '
            f'{len(incomes)} incomes'
        ))