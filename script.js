// Demo accounts (in a real application, this would be in a secure database)
const users = [
    {
        name: 'Admin',
        email: 'admin@school.edu',
        password: 'admin123',
        role: 'admin',
        id: 1
    },
    {
        name: 'Demo Teacher',
        email: 'teacher@school.edu',
        password: 'teacher123',
        role: 'teacher',
        id: 2
    },
    {
        name: 'Student One',
        email: 'student1@school.edu',
        password: 'student123',
        role: 'student',
        id: 3
    },
    {
        name: 'Student Two',
        email: 'student2@school.edu',
        password: 'student123',
        role: 'student',
        id: 4
    }
];

// Function to handle login
function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const role = document.getElementById('role-select').value;

    const user = users.find(u => u.email === email && u.password === password && u.role === role);

    if (user) {
        // Store user info in session
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // Store all users in session if not already stored
        if (!sessionStorage.getItem('allUsers')) {
            sessionStorage.setItem('allUsers', JSON.stringify(users));
        }
        
        // Redirect based on role
        switch (role) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'teacher':
                window.location.href = 'teacher-dashboard.html';
                break;
            case 'student':
                window.location.href = 'student-dashboard.html';
                break;
        }
    } else {
        alert('Invalid credentials or user not found!');
    }
}

// Create teacher dashboard page
function createTeacherDashboard() {
    const teacherDashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teacher Dashboard</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .dashboard-container {
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        .assignment-form {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .assignments-list {
            background: white;
            padding: 20px;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <h1>Teacher Dashboard</h1>
        <div class="assignment-form">
            <h2>Create New Assignment</h2>
            <div class="form-container">
                <input type="text" id="assignment-title" class="input-field" placeholder="Assignment Title">
                <textarea id="assignment-description" class="input-field" placeholder="Assignment Description"></textarea>
                <input type="date" id="assignment-due-date" class="input-field">
                <button onclick="createAssignment()" class="submit-btn">Create Assignment</button>
            </div>
        </div>
        <div class="assignments-list">
            <h2>Your Assignments</h2>
            <div id="assignments-container"></div>
        </div>
    </div>
    <script src="teacher-dashboard.js"></script>
</body>
</html>`;

    return teacherDashboardHTML;
}

// Create student dashboard page
function createStudentDashboard() {
    const studentDashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Dashboard</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .dashboard-container {
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        .assignments-list {
            background: white;
            padding: 20px;
            border-radius: 10px;
        }
        .assignment-card {
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <h1>Student Dashboard</h1>
        <div class="assignments-list">
            <h2>Your Assignments</h2>
            <div id="assignments-container"></div>
        </div>
    </div>
    <script src="student-dashboard.js"></script>
</body>
</html>`;

    return studentDashboardHTML;
} 