from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from members.models import Member
from subscriptions.models import Subscription
from core.models import Club
from .models import Attendance, EntryLog

User = get_user_model()

class AttendanceModelTest(TestCase):
    def setUp(self):
        self.member = Member.objects.create(name="Test Member", membership_number="12345")
        self.subscription = Subscription.objects.create(member=self.member, start_date="2025-01-01", end_date="2025-12-31")
        self.attendance = Attendance.objects.create(subscription=self.subscription)

    def test_attendance_creation(self):
        self.assertEqual(self.attendance.subscription.member.name, "Test Member")


class EntryLogModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='admin', password='admin123')
        self.member = Member.objects.create(name="Entry Member", membership_number="67890")
        self.club = Club.objects.create(name="Main Club")
        self.subscription = Subscription.objects.create(member=self.member, start_date="2025-01-01", end_date="2025-12-31")
        self.entry_log = EntryLog.objects.create(
            member=self.member,
            club=self.club,
            approved_by=self.user,
            related_subscription=self.subscription
        )

    def test_entry_log_creation(self):
        self.assertEqual(self.entry_log.member.name, "Entry Member")
        self.assertEqual(self.entry_log.club.name, "Main Club")
