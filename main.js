// portal/static/portal/main.js

document.addEventListener('DOMContentLoaded', () => {
    const addStudentBtn = document.getElementById('add-student-btn');
    const addStudentModal = $('#add-student-modal'); // Using jQuery for Bootstrap modal
    const addStudentForm = document.getElementById('add-student-form');
    const studentTableBody = document.getElementById('student-table-body');
    
    // Get CSRF token from the cookie for safe POST/PUT/DELETE requests
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    // --- Event Listeners ---

    // Show the "Add Student" modal
    addStudentBtn.addEventListener('click', () => {
        addStudentForm.reset();
        addStudentModal.modal('show');
    });

    // Handle the "Add Student" form submission
    addStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentData = {
            name: document.getElementById('name').value,
            subject: document.getElementById('subject').value,
            marks: parseInt(document.getElementById('marks').value)
        };

        const response = await fetch('/api/students/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(studentData)
        });

        if (response.ok) {
            const newStudent = await response.json();
            // Check if a row for this student already exists (in case of updating marks)
            const existingRow = studentTableBody.querySelector(`tr[data-id='${newStudent.id}']`);
            if (existingRow) {
                // Update marks in the existing row
                existingRow.querySelector('td[data-field="marks"]').textContent = newStudent.marks;
            } else {
                // Add a new row to the table
                const newRow = createStudentRow(newStudent);
                studentTableBody.appendChild(newRow);
            }
            addStudentModal.modal('hide');
        } else {
            alert('Failed to add student. Please check your input.');
        }
    });

    // Handle clicks on Edit and Delete buttons (using event delegation)
    studentTableBody.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('delete-btn')) {
            handleDelete(target);
        } else if (target.classList.contains('edit-btn')) {
            handleEdit(target);
        } else if (target.classList.contains('save-btn')) {
            handleSave(target);
        }
    });

    // --- Helper Functions ---

    function createStudentRow(student) {
        const row = document.createElement('tr');
        row.setAttribute('data-id', student.id);
        row.innerHTML = `
            <td data-field="name">${student.name}</td>
            <td data-field="subject">${student.subject}</td>
            <td data-field="marks">${student.marks}</td>
            <td>
                <button class="btn btn-sm btn-info edit-btn">Edit</button>
                <button class="btn btn-sm btn-danger delete-btn">Delete</button>
            </td>
        `;
        return row;
    }

    async function handleDelete(button) {
        const row = button.closest('tr');
        const studentId = row.dataset.id;
        if (confirm('Are you sure you want to delete this student?')) {
            const response = await fetch(`/api/students/${studentId}/`, {
                method: 'DELETE',
                headers: { 'X-CSRFToken': csrftoken }
            });

            if (response.ok) {
                row.remove();
            } else {
                alert('Failed to delete student.');
            }
        }
    }

    function handleEdit(button) {
        const row = button.closest('tr');
        row.querySelectorAll('td[data-field]').forEach(td => {
            const field = td.dataset.field;
            const value = td.textContent;
            const inputType = field === 'marks' ? 'number' : 'text';
            td.innerHTML = `<input type="${inputType}" class="form-control" value="${value}">`;
        });
        button.textContent = 'Save';
        button.classList.remove('edit-btn', 'btn-info');
        button.classList.add('save-btn', 'btn-primary');
    }

    async function handleSave(button) {
        const row = button.closest('tr');
        const studentId = row.dataset.id;
        const studentData = {};

        row.querySelectorAll('td[data-field]').forEach(td => {
            const field = td.dataset.field;
            const input = td.querySelector('input');
            studentData[field] = input.value;
        });

        const response = await fetch(`/api/students/${studentId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(studentData)
        });

        if (response.ok) {
            const updatedStudent = await response.json();
            // Revert inputs back to text
            row.querySelectorAll('td[data-field]').forEach(td => {
                const field = td.dataset.field;
                td.textContent = updatedStudent[field];
            });
            button.textContent = 'Edit';
            button.classList.remove('save-btn', 'btn-primary');
            button.classList.add('edit-btn', 'btn-info');
        } else {
            alert('Failed to save changes.');
        }
    }
});