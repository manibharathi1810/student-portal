# portal/models.py

from django.db import models
from django.contrib.auth.models import User # Import the User model

class Student(models.Model):
    # Link each student to a specific teacher (User)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    subject = models.CharField(max_length=100)
    marks = models.IntegerField()

    # This constraint ensures a student name + subject is unique for a given teacher
    class Meta:
        unique_together = ('teacher', 'name', 'subject')

    def __str__(self):
        return f"{self.name} - {self.subject}"