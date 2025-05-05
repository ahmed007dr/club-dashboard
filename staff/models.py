from django.db import models
from accounts.models import User
from core.models import Club
from core.models import Club
from accounts.models import User


# Create your models here.
class Shift(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    staff = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)
    shift_start = models.TimeField(auto_now_add=True)
    shift_end = models.TimeField()
    approved_by = models.ForeignKey('accounts.User', related_name='approved_shifts', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.staff.username} - {self.date}"


class StaffAttendance(models.Model):
    staff = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'staff'})
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    check_in = models.DateTimeField(auto_now_add=True)
    check_out = models.DateTimeField(null=True, blank=True)
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, blank=True)

    def duration_hours(self):
        if self.check_out:
            delta = self.check_out - self.check_in
            return round(delta.total_seconds() / 3600, 2)
        return None

    def __str__(self):
        return f"{self.staff.username} - {self.check_in.date()}"
