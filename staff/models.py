from django.db import models
from accounts.models import User
from core.models import Club

class Shift(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    staff = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField() 
    shift_start = models.TimeField()
    shift_end = models.TimeField()
    shift_end_date = models.DateField(null=True, blank=True) 
    approved_by = models.ForeignKey(User, related_name='approved_shifts', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.staff.username} - {self.date} {self.shift_start} to {self.shift_end}"

class StaffAttendance(models.Model):
    staff = models.ForeignKey(User, on_delete=models.CASCADE)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    check_in = models.DateTimeField()
    check_out = models.DateTimeField(null=True, blank=True)
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, blank=True)

    def duration_hours(self):
        if self.check_out:
            delta = self.check_out - self.check_in
            return round(delta.total_seconds() / 3600, 2)
        return 0

    def __str__(self):
        return f"{self.staff.username} - {self.check_in.date()}"