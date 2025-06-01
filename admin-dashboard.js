// Check if user is logged in and is an admin
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = 'index.html';
}

// Get all users from sessionStorage
let allUsers = JSON.parse(sessionStorage.getItem('allUsers')) || [];

// Function to handle logout
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Function to show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.top = '20px';
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Function to update student points and exp
function updateStudentPoints(studentId, pointsToAdd, expToAdd) {
    const userIndex = allUsers.findIndex(u => u.id === studentId);
    
    if (userIndex !== -1) {
        // Initialize if not exists
        if (!allUsers[userIndex].points) {
            allUsers[userIndex].points = 0;
            allUsers[userIndex].exp = 0;
            allUsers[userIndex].level = 1;
        }

        // Update points and exp
        allUsers[userIndex].points += parseInt(pointsToAdd) || 0;
        allUsers[userIndex].exp += parseInt(expToAdd) || 0;

        // Calculate new level
        const oldLevel = allUsers[userIndex].level;
        const newLevel = Math.floor(allUsers[userIndex].exp / 500) + 1;
        
        if (newLevel > oldLevel) {
            allUsers[userIndex].level = newLevel;
            allUsers[userIndex].points += 50; // Level up bonus
        }

        // Save changes
        sessionStorage.setItem('allUsers', JSON.stringify(allUsers));
        
        // Show notification
        showNotification(`Updated ${allUsers[userIndex].name}'s stats successfully`, 'success');
        
        // Refresh display
        displayStudents();
    }
}

// Function to award points and exp to student
function awardPointsAndExp(studentId) {
    const pointsInput = document.getElementById(`points-${studentId}`);
    const expInput = document.getElementById(`exp-${studentId}`);
    
    const pointsToAdd = parseInt(pointsInput.value) || 0;
    const expToAdd = parseInt(expInput.value) || 0;
    
    if (pointsToAdd === 0 && expToAdd === 0) {
        showNotification('Please enter points or exp to award', 'warning');
        return;
    }
    
    updateStudentPoints(studentId, pointsToAdd, expToAdd);
    
    // Clear inputs
    pointsInput.value = '';
    expInput.value = '';
}

// Function to reset student stats
function resetStudentStats(studentId) {
    const userIndex = allUsers.findIndex(u => u.id === studentId);
    
    if (userIndex !== -1) {
        allUsers[userIndex].points = 0;
        allUsers[userIndex].exp = 0;
        allUsers[userIndex].level = 1;
        
        sessionStorage.setItem('allUsers', JSON.stringify(allUsers));
        showNotification(`Reset ${allUsers[userIndex].name}'s stats successfully`, 'success');
        displayStudents();
    }
}

// Function to display students
function displayStudents() {
    const studentList = document.getElementById('student-list');
    const students = allUsers.filter(user => user.role === 'student');
    
    if (students.length === 0) {
        studentList.innerHTML = '<p>No students found</p>';
        return;
    }
    
    const studentsHTML = students.map(student => `
        <div class="student-card">
            <div class="student-info">
                <h3>${student.name}</h3>
                <div class="student-stats">
                    <span>Points: ${student.points || 0}</span>
                    <span>EXP: ${student.exp || 0}</span>
                    <span>Level: ${student.level || 1}</span>
                </div>
            </div>
            <div class="student-actions">
                <input type="number" id="points-${student.id}" class="points-input" placeholder="Points">
                <input type="number" id="exp-${student.id}" class="exp-input" placeholder="EXP">
                <button onclick="awardPointsAndExp('${student.id}')" class="action-btn award-btn">Award</button>
                <button onclick="showResetConfirmation('student', '${student.id}')" class="action-btn reset-btn">Reset Stats</button>
            </div>
        </div>
    `).join('');
    
    studentList.innerHTML = studentsHTML;
}

// Function to show reset confirmation dialog
function showResetConfirmation(type, studentId = null) {
    const dialog = document.getElementById('confirm-dialog');
    const overlay = document.getElementById('dialog-overlay');
    const titleElement = document.getElementById('dialog-title');
    const messageElement = document.getElementById('dialog-message');
    const confirmButton = document.getElementById('confirm-action');
    
    let title = 'Confirm Reset';
    let message = 'Are you sure you want to proceed? This action cannot be undone!';
    
    switch (type) {
        case 'assignments':
            title = 'Reset All Assignments';
            message = 'This will delete all assignments and submissions. Are you sure?';
            break;
        case 'achievements':
            title = 'Reset All Achievements';
            message = 'This will reset all student points, exp, and levels. Are you sure?';
            break;
        case 'all':
            title = 'Reset Everything';
            message = 'This will reset ALL data including assignments, submissions, and student achievements. Are you sure?';
            break;
        case 'student':
            const student = allUsers.find(u => u.id === studentId);
            title = `Reset ${student.name}'s Stats`;
            message = `This will reset ${student.name}'s points, exp, and level to zero. Are you sure?`;
            break;
    }
    
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    confirmButton.onclick = () => {
        switch (type) {
            case 'assignments':
                resetAllAssignments();
                break;
            case 'achievements':
                resetAllAchievements();
                break;
            case 'all':
                resetEverything();
                break;
            case 'student':
                resetStudentStats(studentId);
                break;
        }
        hideConfirmDialog();
    };
    
    dialog.style.display = 'block';
    overlay.style.display = 'block';
}

// Function to hide confirmation dialog
function hideConfirmDialog() {
    const dialog = document.getElementById('confirm-dialog');
    const overlay = document.getElementById('dialog-overlay');
    
    dialog.style.display = 'none';
    overlay.style.display = 'none';
}

// Function to reset all assignments
function resetAllAssignments() {
    localStorage.setItem('assignments', '[]');
    showNotification('All assignments have been reset', 'success');
}

// Function to reset all achievements
function resetAllAchievements() {
    allUsers = allUsers.map(user => {
        if (user.role === 'student') {
            return {
                ...user,
                points: 0,
                exp: 0,
                level: 1
            };
        }
        return user;
    });
    
    sessionStorage.setItem('allUsers', JSON.stringify(allUsers));
    showNotification('All achievements have been reset', 'success');
    displayStudents();
}

// Function to reset everything
function resetEverything() {
    // Reset assignments
    localStorage.setItem('assignments', '[]');
    
    // Reset student achievements
    allUsers = allUsers.map(user => {
        if (user.role === 'student') {
            return {
                ...user,
                points: 0,
                exp: 0,
                level: 1
            };
        }
        return user;
    });
    
    sessionStorage.setItem('allUsers', JSON.stringify(allUsers));
    showNotification('All data has been reset', 'success');
    displayStudents();
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 8px;
        background: white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transform: translateX(120%);
        transition: transform 0.3s ease;
        z-index: 1000;
        font-weight: 500;
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification.success {
        background: var(--success-green);
        color: white;
    }

    .notification.warning {
        background: var(--warning-yellow);
        color: #333;
    }

    .notification.error {
        background: var(--accent-red);
        color: white;
    }
`;

document.head.appendChild(notificationStyles);

// Initial display
displayStudents(); 