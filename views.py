# portal/views.py
import json
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt

from .models import Student
from .forms import LoginForm

# === Page Rendering Views ===

@login_required
def home_view(request):
    # Get all students associated with the currently logged-in teacher
    students = Student.objects.filter(teacher=request.user)
    return render(request, 'portal/home.html', {'students': students})

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('home')
            else:
                # Invalid login
                return render(request, 'portal/login.html', {'form': form, 'error': 'Invalid username or password.'})
    else:
        form = LoginForm()
    return render(request, 'portal/login.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('login')


# === API Views for JavaScript ===
# We use csrf_exempt for simplicity here, but in production, you'd configure CSRF tokens with JS.

@csrf_exempt
@login_required
def student_api_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name')
            subject = data.get('subject')
            marks = int(data.get('marks'))

            if not all([name, subject, marks is not None]):
                return HttpResponseBadRequest("Missing data")

            # Check if student with same name and subject exists for this teacher
            student, created = Student.objects.get_or_create(
                teacher=request.user,
                name=name,
                subject=subject,
                defaults={'marks': marks}
            )

            if not created:
                # If student already exists, add marks to existing marks
                student.marks += marks
                student.save()

            return JsonResponse({'id': student.id, 'name': student.name, 'subject': student.subject, 'marks': student.marks}, status=201 if created else 200)

        except (json.JSONDecodeError, ValueError, KeyError):
            return HttpResponseBadRequest("Invalid data format")

    return JsonResponse({'error': 'Invalid method'}, status=405)


@csrf_exempt
@login_required
def student_detail_api_view(request, student_id):
    try:
        student = Student.objects.get(id=student_id, teacher=request.user)
    except Student.DoesNotExist:
        return JsonResponse({'error': 'Student not found'}, status=404)

    if request.method == 'PUT': # For editing
        try:
            data = json.loads(request.body)
            student.name = data.get('name', student.name)
            student.subject = data.get('subject', student.subject)
            student.marks = int(data.get('marks', student.marks))
            student.save()
            return JsonResponse({'id': student.id, 'name': student.name, 'subject': student.subject, 'marks': student.marks})
        except (json.JSONDecodeError, ValueError):
            return HttpResponseBadRequest("Invalid data format")


    elif request.method == 'DELETE': # For deleting
        student.delete()
        return JsonResponse({'message': 'Student deleted successfully'}, status=204) # 204 No Content

    return JsonResponse({'error': 'Invalid method'}, status=405)