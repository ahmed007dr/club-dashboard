from django.db import models

# Create your models here.
class Shift(models.Model):
    club = models.ForeignKey('core.Club', on_delete=models.CASCADE)
    staff = models.ForeignKey('core.User', on_delete=models.CASCADE)
    date = models.DateField()
    shift_start = models.TimeField()
    shift_end = models.TimeField()
    approved_by = models.ForeignKey('core.User', related_name='approved_shifts', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.staff.username} - {self.date}"

