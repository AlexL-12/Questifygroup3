// Check if user is logged in and is a teacher
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
if (!currentUser || currentUser.role !== 'teacher') {
    window.location.href = 'index.html';
}

// Get assignments from localStorage
let assignments = JSON.parse(localStorage.getItem('assignments')) || [];

// Function to handle logout
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Function to get student info
function getStudentInfo(studentId) {
    const allUsers = JSON.parse(sessionStorage.getItem('allUsers')) || [];
    return allUsers.find(u => u.id === studentId) || { points: 0, level: 1 };
}

// Function to check if date is past due
function isPastDue(dueDate) {
    return new Date() > new Date(dueDate);
}

// Function to format time remaining
function formatTimeRemaining(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;

    if (diff < 0) {
        return 'Past due';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    }
}

// Function to update student points and EXP
function updateStudentPoints(studentId, pointsToAdd, expToAdd = 0) {
    let allUsers = JSON.parse(sessionStorage.getItem('allUsers')) || [];
    const userIndex = allUsers.findIndex(u => u.id === studentId);
    
    if (userIndex !== -1) {
        // Initialize points and exp if not exists
        if (!allUsers[userIndex].points) {
            allUsers[userIndex].points = 0;
            allUsers[userIndex].exp = 0;
            allUsers[userIndex].level = 1;
        }

        // Update points first
        if (pointsToAdd > 0) {
            allUsers[userIndex].points += pointsToAdd;
            showNotification(`+${pointsToAdd} Points`, 'points', 80);
        }

        // Update EXP after a short delay
        if (expToAdd > 0) {
            setTimeout(() => {
                allUsers[userIndex].exp = (allUsers[userIndex].exp || 0) + expToAdd;
                showNotification(`+${expToAdd} EXP`, 'exp', 140);

                // Calculate new level
                const oldLevel = allUsers[userIndex].level;
                const newLevel = Math.floor((allUsers[userIndex].exp || 0) / 500) + 1;
                
                // Check for level up
                if (newLevel > oldLevel) {
                    allUsers[userIndex].level = newLevel;
                    const levelUpBonus = 50; // Points bonus for leveling up
                    allUsers[userIndex].points += levelUpBonus;
                    
                    // Show level up notification after EXP notification
                    setTimeout(() => {
                        showNotification(`Level Up! Now Level ${newLevel}`, 'level-up', 200);
                        // Show bonus points notification
                        setTimeout(() => {
                            showNotification(`+${levelUpBonus} Level Up Bonus Points`, 'points', 260);
                        }, 500);
                    }, 500);
                }

                // Store updated user data
                sessionStorage.setItem('allUsers', JSON.stringify(allUsers));
                
                // Update current user if this is them
                if (studentId === currentUser.id) {
                    currentUser.points = allUsers[userIndex].points;
                    currentUser.exp = allUsers[userIndex].exp;
                    currentUser.level = allUsers[userIndex].level;
                    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                }

                // Trigger a custom event to notify of points/exp update
                const event = new CustomEvent('statsUpdated', {
                    detail: {
                        userId: studentId,
                        newPoints: allUsers[userIndex].points,
                        newExp: allUsers[userIndex].exp,
                        newLevel: allUsers[userIndex].level
                    }
                });
                window.dispatchEvent(event);
            }, 500); // Delay EXP update by 500ms after points
        }

        // Store initial points update
        sessionStorage.setItem('allUsers', JSON.stringify(allUsers));
    }
}

// Function to switch tabs
function switchTab(tabName) {
    // Update tab buttons with animation
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.classList.contains('active')) {
            tab.classList.remove('active');
        }
    });
    const activeTab = document.querySelector(`.tab[onclick*="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Update tab content with fade effect
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.classList.contains('active')) {
            content.style.opacity = '0';
            setTimeout(() => {
                content.classList.remove('active');
                content.style.display = 'none';
            }, 300);
        }
    });

    const newActiveContent = document.getElementById(`${tabName}-tab`);
    if (newActiveContent) {
        setTimeout(() => {
            newActiveContent.style.display = 'block';
            newActiveContent.classList.add('active');
            setTimeout(() => {
                newActiveContent.style.opacity = '1';
            }, 50);
        }, 300);
    }

    // Refresh the display for the selected tab
    displayAssignments(tabName);
}

// Function to approve assignment
function approveAssignment(assignmentId, submissionIndex) {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const submission = assignment.submissions[submissionIndex];
    if (!submission) return;

    // Get teacher's advice
    const adviceTextarea = document.getElementById(`advice-${assignmentId}-${submissionIndex}`);
    const teacherAdvice = adviceTextarea.value.trim();
    
    if (!teacherAdvice) {
        alert('Please provide advice for the student before approving.');
        return;
    }

    // Update submission
    submission.approved = true;
    submission.teacherAdvice = teacherAdvice;
    submission.approvedAt = new Date().toISOString();
    submission.latePenalty = isPastDue(assignment.dueDate);

    // Save to localStorage
    localStorage.setItem('assignments', JSON.stringify(assignments));
    
    // Award points and EXP if not late
    if (!submission.latePenalty) {
        updateStudentPoints(submission.studentId, 50, 100); // 50 points and 100 EXP
    }
    
    // Switch to approved tab and refresh display
    switchTab('approved');
    
    // Show success notification
    showNotification('Submission approved successfully', 'success');
}

// Function to disapprove assignment
function disapproveAssignment(assignmentId, submissionIndex) {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const submission = assignment.submissions[submissionIndex];
    if (!submission) return;

    // Get teacher's advice
    const adviceTextarea = document.getElementById(`advice-${assignmentId}-${submissionIndex}`);
    const teacherAdvice = adviceTextarea.value.trim();
    
    if (!teacherAdvice) {
        alert('Please provide feedback explaining what needs to be revised.');
        return;
    }

    // Update submission
    submission.approved = false;
    submission.teacherAdvice = teacherAdvice;
    submission.needsRevision = true;
    submission.disapprovedAt = new Date().toISOString();
    submission.revisionRequest = {
        requestedAt: new Date().toISOString(),
        feedback: teacherAdvice
    };

    // Save to localStorage
    localStorage.setItem('assignments', JSON.stringify(assignments));
    
    // Refresh display
    displayAssignments(getCurrentTab());
    updateStats();
}

// Function to get current active tab
function getCurrentTab() {
    const activeTab = document.querySelector('.tab.active');
    return activeTab ? activeTab.getAttribute('onclick').replace('switchTab(\'', '').replace('\')', '') : 'pending';
}

// Function to create empty state element
function createEmptyState(message, submessage) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <div class="empty-state-text">${message}</div>
            <div class="empty-state-subtext">${submessage}</div>
        </div>
    `;
}

// Function to display assignments
function displayAssignments(tabName = 'pending') {
    const container = document.getElementById('assignments-container');
    
    // Filter assignments based on tab
    let filteredAssignments = assignments.filter(assignment => {
        const hasSubmissions = assignment.submissions && assignment.submissions.length > 0;
        if (!hasSubmissions && tabName !== 'pending') return false;

        if (tabName === 'approved') {
            return assignment.submissions.some(sub => sub.approved);
        } else if (tabName === 'pending') {
            // Include both new assignments and assignments with pending submissions
            return !hasSubmissions || assignment.submissions.some(sub => !sub.approved);
        }
        return true;
    });

    if (filteredAssignments.length === 0) {
        container.innerHTML = createEmptyState(
            tabName === 'approved' ? "No Approved Assignments" : "No Pending Assignments",
            tabName === 'approved' ? "Approved assignments will appear here" : "New submissions will appear here"
        );
        return;
    }

    // Add metadata for sorting
    filteredAssignments = filteredAssignments.map(assignment => {
        const latestSubmission = assignment.submissions && assignment.submissions.length > 0
            ? Math.max(...assignment.submissions.map(sub => new Date(sub.submittedAt).getTime()))
            : 0;
        
        return {
            ...assignment,
            hasUnclaimedRewards: assignment.submissions?.some(sub => 
                sub.approved && !sub.rewardClaimed && !sub.latePenalty
            ) || false,
            isNewAssignment: !assignment.submissions || assignment.submissions.length === 0,
            latestActivity: Math.max(
                new Date(assignment.createdAt || 0).getTime(),
                latestSubmission
            )
        };
    });

    // Sort assignments based on tab
    if (tabName === 'approved') {
        // For approved tab: unclaimed rewards first, then by latest approval
        filteredAssignments.sort((a, b) => {
            // First priority: unclaimed rewards
            if (a.hasUnclaimedRewards && !b.hasUnclaimedRewards) return -1;
            if (!a.hasUnclaimedRewards && b.hasUnclaimedRewards) return 1;
            
            // Second priority: latest approval date
            const aLatestApproval = Math.max(...(a.submissions || [])
                .filter(sub => sub.approved)
                .map(sub => new Date(sub.approvedAt).getTime()));
            const bLatestApproval = Math.max(...(b.submissions || [])
                .filter(sub => sub.approved)
                .map(sub => new Date(sub.approvedAt).getTime()));
            
            return bLatestApproval - aLatestApproval;
        });
    } else {
        // For pending tab: new assignments first, then by latest activity
        filteredAssignments.sort((a, b) => {
            // First priority: new assignments
            if (a.isNewAssignment && !b.isNewAssignment) return -1;
            if (!a.isNewAssignment && b.isNewAssignment) return 1;

            // Second priority: latest activity (submission or creation)
            return b.latestActivity - a.latestActivity;
        });
    }

    const assignmentsHTML = filteredAssignments.map(assignment => {
        const relevantSubmissions = assignment.submissions?.filter(sub => 
            tabName === 'approved' ? sub.approved : !sub.approved
        ) || [];

        // Sort submissions by date (newest first)
        relevantSubmissions.sort((a, b) => {
            if (tabName === 'approved') {
                // For approved tab: unclaimed rewards first, then by approval date
                const aUnclaimed = !a.rewardClaimed && !a.latePenalty;
                const bUnclaimed = !b.rewardClaimed && !b.latePenalty;
                if (aUnclaimed && !bUnclaimed) return -1;
                if (!aUnclaimed && bUnclaimed) return 1;
                return new Date(b.approvedAt) - new Date(a.approvedAt);
            } else {
                // For pending tab: newest submissions first
                return new Date(b.submittedAt) - new Date(a.submittedAt);
            }
        });

        // Add new assignment banner if no submissions
        const isNewAssignment = !assignment.submissions || assignment.submissions.length === 0;
        const hasUnclaimedRewards = relevantSubmissions.some(sub => 
            sub.approved && !sub.rewardClaimed && !sub.latePenalty
        );

        const submissionsHTML = relevantSubmissions.map((submission, index) => {
            const isPastDue = new Date(assignment.dueDate) < new Date(submission.submittedAt);
            const approvalDate = submission.approvedAt ? new Date(submission.approvedAt).toLocaleString() : null;
            const hasUnclaimedReward = submission.approved && !submission.rewardClaimed && !submission.latePenalty;
            
            return `
                <div class="submission-card ${submission.approved ? 'approved' : ''} ${hasUnclaimedReward ? 'unclaimed-reward' : ''} ${submission.needsRevision ? 'needs-revision' : ''}">
                    ${hasUnclaimedReward ? `
                        <div class="unclaimed-banner">
                            Reward Available for Student
                        </div>
                    ` : ''}
                    ${submission.needsRevision ? `
                        <div class="revision-banner">
                            Revision Requested
                        </div>
                    ` : ''}
                    <div class="submission-header">
                        <h4>Submission by ${submission.studentName}</h4>
                        <div class="submission-meta">
                            <span class="submission-date">
                                Submitted on ${new Date(submission.submittedAt).toLocaleString()}
                                ${isPastDue ? ' <span class="late-tag">LATE</span>' : ''}
                            </span>
                            ${submission.disapprovedAt ? `
                                <span class="revision-date">
                                    Revision requested on ${new Date(submission.disapprovedAt).toLocaleString()}
                                </span>
                            ` : ''}
                            ${submission.approved ? `
                                <span class="approval-date">
                                    Approved on ${approvalDate}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="submission-content">
                        <div class="content-section">
                            <h5>Student's Work:</h5>
                            <p>${submission.content}</p>
                        </div>
                        ${submission.needsRevision ? `
                            <div class="revision-section">
                                <h5>Revision Request:</h5>
                                <p class="revision-feedback">${submission.teacherAdvice}</p>
                            </div>
                        ` : ''}
                    </div>
                    ${submission.approved ? `
                        <div class="approval-status">
                            <div class="status-header">
                                <span class="approved-tag">✓ Approved</span>
                                ${submission.latePenalty ? 
                                    '<span class="penalty-tag">Late Submission - No Points Awarded</span>' : 
                                    '<span class="points-tag">+50 Points Awarded</span>'
                                }
                            </div>
                            <div class="teacher-advice">
                                <h5>Your Feedback:</h5>
                                <p>${submission.teacherAdvice}</p>
                            </div>
                            ${submission.rewardClaimed ? `
                                <div class="reward-status">
                                    <span class="claimed-tag">✓ Student has claimed rewards</span>
                                </div>
                            ` : `
                                <div class="reward-status">
                                    <span class="pending-tag">Pending student reward claim</span>
                                </div>
                            `}
                        </div>
                    ` : `
                        <div class="approval-actions">
                            <div class="advice-input">
                                <label for="advice-${assignment.id}-${index}">
                                    ${submission.needsRevision ? 
                                        'Update revision feedback for the student:' : 
                                        'Provide feedback for the student:'}
                                </label>
                                <textarea id="advice-${assignment.id}-${index}" 
                                    class="advice-textarea" 
                                    placeholder="${submission.needsRevision ? 
                                        'Update your feedback explaining what needs to be revised...' : 
                                        'Enter your feedback and advice for the student...'}"
                                >${submission.teacherAdvice || ''}</textarea>
                            </div>
                            <div class="button-group">
                                <button onclick="approveAssignment(${assignment.id}, ${index})" class="approve-btn">
                                    Approve with Advice
                                </button>
                                <button onclick="disapproveAssignment(${assignment.id}, ${index})" class="disapprove-btn">
                                    ${submission.needsRevision ? 'Update Revision Request' : 'Request Revision'}
                                </button>
                            </div>
                        </div>
                    `}
                </div>
            `;
        }).join('');

        return `
            <div class="assignment-card ${hasUnclaimedRewards ? 'has-unclaimed-rewards' : ''} ${isNewAssignment ? 'new-assignment' : ''}">
                <div class="assignment-header">
                    <div class="header-content">
                        <h3 class="assignment-title">${assignment.title}</h3>
                        <div class="assignment-meta">
                            <span class="due-date">Due: ${new Date(assignment.dueDate).toLocaleDateString()}</span>
                            ${isNewAssignment ? `
                                <span class="created-date">Created: ${new Date(assignment.createdAt).toLocaleString()}</span>
                            ` : `
                                <span class="submission-count">${relevantSubmissions.length} submission${relevantSubmissions.length !== 1 ? 's' : ''}</span>
                            `}
                        </div>
                    </div>
                    <button onclick="deleteAssignment(${assignment.id})" class="delete-btn" title="Delete Assignment">
                        <span class="delete-icon">🗑️</span>
                    </button>
                </div>
                <p class="assignment-description">${assignment.description}</p>
                ${isNewAssignment ? `
                    <div class="no-submissions-message">
                        <p>No submissions yet</p>
                    </div>
                ` : `
                    <div class="submissions-list">
                        ${submissionsHTML}
                    </div>
                `}
            </div>
        `;
    }).join('');

    container.innerHTML = assignmentsHTML;
}

// Function to update statistics
function updateStats() {
    const totalSubmissions = assignments.reduce((acc, curr) => 
        acc + (curr.submissions ? curr.submissions.length : 0), 0);
    const pendingSubmissions = assignments.reduce((acc, curr) => 
        acc + (curr.submissions ? curr.submissions.filter(sub => !sub.approved).length : 0), 0);
    const approvedSubmissions = totalSubmissions - pendingSubmissions;
    
    document.getElementById('total-submissions').textContent = totalSubmissions;
    document.getElementById('pending-submissions').textContent = pendingSubmissions;
    document.getElementById('approved-submissions').textContent = approvedSubmissions;
}

// Function to create a new assignment
function createAssignment() {
    const title = document.getElementById('assignment-title').value;
    const description = document.getElementById('assignment-description').value;
    const dueDate = document.getElementById('assignment-due-date').value;

    if (!title || !description || !dueDate) {
        alert('Please fill in all fields!');
        return;
    }

    const assignment = {
        id: Date.now(),
        title,
        description,
        dueDate,
        teacherId: currentUser.id,
        createdAt: new Date().toISOString(),
        submissions: []
    };

    assignments.push(assignment);
    localStorage.setItem('assignments', JSON.stringify(assignments));
    
    // Clear form and refresh display
    document.getElementById('assignment-title').value = '';
    document.getElementById('assignment-description').value = '';
    document.getElementById('assignment-due-date').value = '';
    
    displayAssignments();
    updateStats();
}

// Function to delete an assignment
function deleteAssignment(assignmentId) {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
        return;
    }

    assignments = assignments.filter(a => a.id !== assignmentId);
    localStorage.setItem('assignments', JSON.stringify(assignments));
    
    // Refresh the display and update statistics
    displayAssignments(getCurrentTab());
    updateStats();
    
    // Show success notification
    showNotification('Assignment deleted successfully', 'success');
}

// Add styles for modern interface
const modernStyles = document.createElement('style');
modernStyles.textContent = `
    :root {
        --primary-blue: #1a73e8;
        --secondary-blue: #4285f4;
        --accent-red: #dc3545;
        --hover-red: #c82333;
        --light-gray: #f8f9fa;
        --success-green: #28a745;
        --gold: #ffd700;
        --border-gray: #dee2e6;
    }

    body {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: var(--light-gray);
    }

    .top-nav {
        background: var(--primary-blue);
        color: white;
        padding: 1rem 2rem;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .container {
        max-width: 1200px;
        margin: 80px auto 2rem;
        padding: 2rem;
    }

    .stats-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        text-align: center;
        transition: transform 0.2s;
    }

    .stat-card:hover {
        transform: translateY(-2px);
    }

    .stat-number {
        font-size: 2rem;
        color: var(--primary-blue);
        font-weight: bold;
        margin-bottom: 0.5rem;
    }

    .stat-label {
        color: #666;
        font-size: 0.9rem;
    }

    .tabs-container {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 2rem;
    }

    .tab {
        background: none;
        border: none;
        padding: 0.75rem 1.5rem;
        cursor: pointer;
        font-size: 1rem;
        color: #666;
        border-radius: 6px;
        transition: all 0.3s;
        margin-right: 0.5rem;
    }

    .tab:hover:not(.active) {
        background: var(--light-gray);
    }

    .tab.active {
        background: var(--primary-blue);
        color: white;
        font-weight: 500;
    }

    .assignment-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 1.5rem;
        padding: 1.5rem;
        transition: transform 0.2s;
    }

    .assignment-card:hover {
        transform: translateY(-2px);
    }

    .assignment-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-gray);
    }

    .assignment-title {
        color: var(--primary-blue);
        margin: 0;
        font-size: 1.3rem;
    }

    .assignment-meta {
        display: flex;
        gap: 1rem;
        color: #666;
        font-size: 0.9rem;
    }

    .submission-card {
        background: var(--light-gray);
        border-radius: 6px;
        padding: 1.5rem;
        margin-top: 1rem;
    }

    .submission-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
    }

    .submission-meta {
        text-align: right;
        color: #666;
        font-size: 0.9rem;
    }

    .content-section {
        background: white;
        padding: 1.5rem;
        border-radius: 6px;
        margin-bottom: 1rem;
    }

    .content-section h5 {
        color: var(--primary-blue);
        margin: 0 0 0.5rem 0;
    }

    .advice-input {
        margin: 1rem 0;
    }

    .advice-textarea {
        width: 100%;
        min-height: 100px;
        padding: 1rem;
        border: 1px solid var(--border-gray);
        border-radius: 6px;
        font-family: inherit;
        font-size: 0.95rem;
        resize: vertical;
        transition: border-color 0.3s;
    }

    .advice-textarea:focus {
        outline: none;
        border-color: var(--primary-blue);
    }

    .button-group {
        display: flex;
        gap: 1rem;
    }

    .approve-btn, .disapprove-btn {
        flex: 1;
        padding: 0.75rem;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
    }

    .approve-btn {
        background: var(--success-green);
        color: white;
    }

    .approve-btn:hover {
        background: #218838;
    }

    .disapprove-btn {
        background: var(--accent-red);
        color: white;
    }

    .disapprove-btn:hover {
        background: var(--hover-red);
    }

    .empty-state {
        text-align: center;
        padding: 3rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .empty-state-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: var(--primary-blue);
    }

    .empty-state-text {
        font-size: 1.5rem;
        color: var(--primary-blue);
        margin-bottom: 0.5rem;
    }

    .empty-state-subtext {
        color: #666;
    }

    .section-title {
        color: var(--primary-blue);
        font-size: 1.5rem;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .create-assignment-form {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 2rem;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: #333;
    }

    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-gray);
        border-radius: 6px;
        font-family: inherit;
        font-size: 0.95rem;
    }

    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--primary-blue);
    }

    .submit-btn {
        background: var(--primary-blue);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.3s;
    }

    .submit-btn:hover {
        background: var(--secondary-blue);
    }

    .logout-btn {
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.3s;
    }

    .logout-btn:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .tab-content {
        animation: fadeIn 0.3s ease;
    }
`;

document.head.appendChild(modernStyles);

// Update notification styles to include different types
const updatedNotificationStyles = document.createElement('style');
updatedNotificationStyles.textContent = `
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
        font-weight: bold;
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification.success {
        top: 20px;
        background: var(--success-green);
        color: white;
    }

    .notification.points {
        background: linear-gradient(45deg, #ffd700, #ffa500);
        color: white;
    }

    .notification.exp {
        background: linear-gradient(45deg, #4caf50, #45a049);
        color: white;
    }

    .notification.level-up {
        background: linear-gradient(45deg, #2196f3, #1976d2);
        color: white;
        font-size: 1.1em;
    }

    /* Animation for notifications */
    @keyframes notification-slide {
        0% { transform: translateX(120%); }
        15% { transform: translateX(-10%); }
        30% { transform: translateX(5%); }
        45% { transform: translateX(-2%); }
        60% { transform: translateX(0); }
        100% { transform: translateX(0); }
    }

    .notification.show {
        animation: notification-slide 0.5s ease forwards;
    }
`;

// Remove the old notification styles and add the updated ones
const oldNotificationStyles = document.querySelector('style');
if (oldNotificationStyles) {
    oldNotificationStyles.remove();
}
document.head.appendChild(updatedNotificationStyles);

// Update showNotification function to handle positioning
function showNotification(message, type = 'info', topOffset = 20) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.top = `${topOffset}px`;
    
    // Add notification to the page
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initial display
displayAssignments();
updateStats();

async function loadFeedback() {
    const feedbackList = document.getElementById('feedback-list');
    
    try {
        const response = await fetch('http://localhost:3000/api/feedback');
        if (!response.ok) {
            throw new Error('Failed to load feedback');
        }
        
        const feedbacks = await response.json();
        
        if (feedbacks.length === 0) {
            feedbackList.innerHTML = `
                <div class="no-feedback">
                    No feedback has been received yet.
                </div>
            `;
            return;
        }

        // Group feedback by type (general or assignment)
        const generalFeedback = feedbacks.filter(f => f.type === 'general');
        const assignmentFeedback = feedbacks.filter(f => f.type === 'assignment');

        let html = '';

        // Display general feedback
        if (generalFeedback.length > 0) {
            html += `
                <div class="feedback-group">
                    <h3 class="feedback-group-title">General Feedback</h3>
                    ${generalFeedback.map(feedback => `
                        <div class="feedback-item">
                            <div class="feedback-meta">
                                <span class="feedback-student">${feedback.studentName}</span>
                                <span class="feedback-date">${new Date(feedback.timestamp).toLocaleString()}</span>
                            </div>
                            <div class="feedback-content">${feedback.feedback}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Display assignment feedback
        if (assignmentFeedback.length > 0) {
            html += `
                <div class="feedback-group">
                    <h3 class="feedback-group-title">Assignment Feedback</h3>
                    ${assignmentFeedback.map(feedback => `
                        <div class="feedback-item">
                            <div class="feedback-meta">
                                <span class="feedback-student">${feedback.studentName}</span>
                                <span class="feedback-date">${new Date(feedback.timestamp).toLocaleString()}</span>
                            </div>
                            <div class="feedback-content">${feedback.feedback}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        feedbackList.innerHTML = html;
    } catch (error) {
        console.error('Error loading feedback:', error);
        feedbackList.innerHTML = `
            <div class="error-message">
                Failed to load feedback. Please try again later.
            </div>
        `;
    }
}

// Call loadFeedback when the page loads
document.addEventListener('DOMContentLoaded', loadFeedback); 