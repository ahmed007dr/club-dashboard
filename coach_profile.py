import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from django.core.management.base import BaseCommand
from accounts.models import User
from subscriptions.models import CoachProfile

class Command(BaseCommand):
    help = 'Creates CoachProfile for existing users with role=coach and is_active=True'

    def handle(self, *args, **kwargs):
        # Find all active coaches without a CoachProfile
        coaches = User.objects.filter(role='coach', is_active=True, coach_profile__isnull=True)
        count = coaches.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No coaches need a CoachProfile.'))
            return
        
        self.stdout.write(f'Found {count} coaches without CoachProfile.')
        
        created = 0
        for coach in coaches:
            try:
                CoachProfile.objects.get_or_create(user=coach, defaults={'max_trainees': 0})
                self.stdout.write(f'Created CoachProfile for {coach.username}')
                created += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating CoachProfile for {coach.username}: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {created} CoachProfile(s).'))