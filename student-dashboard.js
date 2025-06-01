// Check if user is logged in and is a student
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
if (!currentUser || currentUser.role !== 'student') {
    window.location.href = 'index.html';
}

// Initialize user data if not exists
if (!currentUser.points) {
    currentUser.points = 0;
    currentUser.exp = 0;
    currentUser.level = 1;
    currentUser.achievements = [];
    currentUser.onTimeSubmissions = 0;
    currentUser.buffs = {
        expMultiplier: 1,
        pointsMultiplier: 1,
        expMultiplierEndTime: null,
        pointsMultiplierEndTime: null
    };
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// Constants for rewards
const REWARDS = {
    ON_TIME_SUBMISSION: {
        exp: 100,
        points: 50
    },
    LEVEL_UP: {
        points: 50
    },
    EXP_PER_LEVEL: 500
};

const LUCKY_WHEEL_REWARDS = [
    { name: '2x EXP (3 days)', chance: 5, type: 'buff', buff: 'exp' },
    { name: '2x Points (3 days)', chance: 5, type: 'buff', buff: 'points' },
    { name: '200 Points', chance: 30, type: 'points', value: 200 },
    { name: '200 EXP', chance: 55, type: 'exp', value: 200 },
    { name: '1000 Points', chance: 1, type: 'points', value: 1000 },
    { name: 'Special Reward 1', chance: 1, type: 'special', value: 1 },
    { name: 'Special Reward 2', chance: 1, type: 'special', value: 2 },
    { name: 'Special Reward 3', chance: 1, type: 'special', value: 3 },
    { name: 'Special Reward 4', chance: 1, type: 'special', value: 4 }
];

// Function to handle logout
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Function to calculate level from points
function calculateLevel(points) {
    return Math.floor(points / 500) + 1;
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

// Function to show points notification
function showPointsNotification(points) {
    const notification = document.createElement('div');
    notification.className = 'points-notification notification';
    notification.innerHTML = `+${points} Points`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Function to get latest user data
function getLatestUserData() {
    const allUsers = JSON.parse(sessionStorage.getItem('allUsers')) || [];
    const userData = allUsers.find(u => u.id === currentUser.id);
    if (userData) {
        // Update current user data with latest values
        currentUser.points = userData.points || 0;
        currentUser.exp = userData.exp || 0;
        currentUser.level = userData.level || 1;
        currentUser.achievements = userData.achievements || [];
        currentUser.onTimeSubmissions = userData.onTimeSubmissions || 0;
        currentUser.buffs = userData.buffs || {
            expMultiplier: 1,
            pointsMultiplier: 1,
            expMultiplierEndTime: null,
            pointsMultiplierEndTime: null
        };
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        return userData;
    }
    return currentUser;
}

// Function to update points display
function updatePointsDisplay() {
    const userData = getLatestUserData();
    document.getElementById('total-points').textContent = userData.points || 0;
    document.getElementById('current-level').textContent = userData.level || 1;
}

// Function to check for points updates
function checkForPointsUpdates() {
    const previousPoints = currentUser.points;
    const userData = getLatestUserData();
    
    if (userData.points > previousPoints) {
        // Show notification for new points
        showPointsNotification(userData.points - previousPoints);
    }
    
    updatePointsDisplay();
}

// Function to update statistics
function updateStats() {
    const totalAvailable = assignments.length;
    const completedAssignments = assignments.filter(a => 
        a.submissions.some(sub => sub.studentId === currentUser.id && sub.approved)
    ).length;
    const pendingAssignments = assignments.filter(a => 
        a.submissions.some(sub => sub.studentId === currentUser.id && !sub.approved)
    ).length;

    document.getElementById('total-available').textContent = totalAvailable;
    document.getElementById('completed-assignments').textContent = completedAssignments;
    document.getElementById('pending-assignments').textContent = pendingAssignments;
}

// Function to switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.tab[onclick*="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
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
function displayAssignments() {
    const unsubmittedContainer = document.getElementById('unsubmitted-assignments');
    const submittedContainer = document.getElementById('submitted-assignments');
    
    // Filter assignments
    const unsubmittedAssignments = assignments.filter(a => 
        !a.submissions.some(sub => sub.studentId === currentUser.id)
    );
    
    const submittedAssignments = assignments.filter(a => 
        a.submissions.some(sub => sub.studentId === currentUser.id)
    );

    // Display unsubmitted assignments
    if (unsubmittedAssignments.length === 0) {
        unsubmittedContainer.innerHTML = createEmptyState(
            "No Unsubmitted Assignments",
            "You've submitted all available assignments!"
        );
    } else {
        unsubmittedContainer.innerHTML = unsubmittedAssignments.map(assignment => {
            const isPastDueDate = isPastDue(assignment.dueDate);
            const timeRemaining = formatTimeRemaining(assignment.dueDate);

            return `
                <div class="assignment-card">
                    <div class="assignment-header">
                        <h3 class="assignment-title">${assignment.title}</h3>
                        <div class="due-date-container">
                            <span class="due-date">Due: ${new Date(assignment.dueDate).toLocaleDateString()}</span>
                            <span class="time-remaining ${isPastDueDate ? 'past-due' : ''}">${timeRemaining}</span>
                        </div>
                    </div>
                    <p class="assignment-description">${assignment.description}</p>
                    <div class="submission-form">
                        ${isPastDueDate ? `
                            <div style="color: var(--accent-red); margin-bottom: 1rem; padding: 0.5rem; background: #fff3f3; border-radius: 5px;">
                                ⚠️ This assignment is past due. You can still submit, but no points will be awarded.
                            </div>
                        ` : ''}
                        <textarea id="submission-${assignment.id}" class="input-field" 
                            placeholder="Enter your answer"></textarea>
                        <button onclick="submitAssignment(${assignment.id})" class="submit-btn">
                            Submit Assignment${isPastDueDate ? ' (No points)' : ' (50 points if approved)'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Display submitted assignments
    if (submittedAssignments.length === 0) {
        submittedContainer.innerHTML = createEmptyState(
            "No Submitted Assignments",
            "Start working on your assignments to see them here!"
        );
    } else {
        submittedContainer.innerHTML = submittedAssignments.map(assignment => {
            const submission = assignment.submissions.find(sub => sub.studentId === currentUser.id);
            const isApproved = submission.approved;
            const isPastDueDate = isPastDue(assignment.dueDate);
            const hasTeacherAdvice = submission.teacherAdvice;
            const isRewardClaimed = submission.rewardClaimed;

            return `
                <div class="assignment-card">
                    <div class="assignment-header">
                        <h3 class="assignment-title">${assignment.title}</h3>
                        <div class="due-date-container">
                            <span class="due-date">Due: ${new Date(assignment.dueDate).toLocaleDateString()}</span>
                            <span class="time-remaining ${isPastDueDate ? 'past-due' : ''}">${formatTimeRemaining(assignment.dueDate)}</span>
                        </div>
                    </div>
                    <p class="assignment-description">${assignment.description}</p>
                    <div class="submission-status ${isApproved ? 'approved' : 'pending'}">
                        ${isApproved 
                            ? `Approved ✓ ${
                                submission.latePenalty 
                                    ? '<span style="color: var(--accent-red);">(No points - Late submission)</span>'
                                    : isRewardClaimed
                                        ? '<span style="color: var(--success-green);">(Rewards Claimed)</span>'
                                        : '<span style="color: var(--primary-blue);">(Review teacher\'s advice to claim rewards)</span>'
                            }`
                            : `Submitted (Pending Approval)${
                                isPastDueDate ? ' <span style="color: var(--accent-red);">(Late submission - No points will be awarded)</span>' : ''
                            }`
                        }
                        <span style="color: #666; font-size: 0.9rem; font-weight: normal;">
                            on ${new Date(submission.submittedAt).toLocaleString()}
                        </span>
                    </div>
                    <div class="submission-content">
                        <h4 style="color: var(--primary-blue); margin: 1rem 0 0.5rem;">Your Submission:</h4>
                        <p style="white-space: pre-wrap; background: var(--light-gray); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            ${submission.content}
                        </p>
                        ${hasTeacherAdvice ? `
                            <div class="teacher-advice">
                                <h4 style="color: var(--primary-blue); margin: 1rem 0 0.5rem;">
                                    Teacher's Advice:
                                </h4>
                                <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                                    <p style="white-space: pre-wrap; margin: 0; color: #1565c0;">
                                        ${submission.teacherAdvice}
                                    </p>
                                </div>
                                ${isApproved && !submission.latePenalty && !isRewardClaimed ? `
                                    <button onclick="claimRewards(${assignment.id})" class="claim-rewards-btn">
                                        Claim Rewards (+100 EXP, +50 Points)
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}
                        <div class="feedback-section">
                            <button class="feedback-btn" onclick="toggleFeedbackForm(${assignment.id})">Provide Feedback</button>
                            <div id="feedback-form-${assignment.id}" class="feedback-form" style="display: none;">
                                <textarea class="feedback-textarea" placeholder="Enter your feedback about this assignment..."></textarea>
                                <button class="submit-feedback-btn" onclick="submitFeedback(${assignment.id})">Submit Feedback</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Function to submit an assignment
function submitAssignment(assignmentId) {
    const submissionText = document.getElementById(`submission-${assignmentId}`).value;
    
    if (!submissionText.trim()) {
        alert('Please enter your answer before submitting!');
        return;
    }

    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment) {
        const isOnTime = !isPastDue(assignment.dueDate);
        const submission = {
            studentId: currentUser.id,
            studentName: currentUser.name,
            content: submissionText,
            submittedAt: new Date().toISOString(),
            approved: false,
            isOnTime: isOnTime,
            rewardClaimed: false
        };

        assignment.submissions.push(submission);
        localStorage.setItem('assignments', JSON.stringify(assignments));
        refreshData();
    }
}

// Function to refresh data
function refreshData() {
    assignments = JSON.parse(localStorage.getItem('assignments')) || [];
    checkForPointsUpdates();
    updateStats();
    displayAssignments();
    updateBuffTimers();
}

// Set up periodic refresh
setInterval(refreshData, 2000); // Check for updates every 2 seconds

// Initial display
refreshData();

// Function to handle lucky wheel spin
function spinLuckyWheel() {
    const random = Math.random() * 100;
    let sum = 0;
    
    for (const reward of LUCKY_WHEEL_REWARDS) {
        sum += reward.chance;
        if (random <= sum) {
            applyReward(reward);
            break;
        }
    }
}

// Function to apply rewards
function applyReward(reward) {
    const userData = getLatestUserData();
    
    switch (reward.type) {
        case 'buff':
            const endTime = new Date();
            endTime.setDate(endTime.getDate() + 3);
            
            if (reward.buff === 'exp') {
                userData.buffs.expMultiplier = 2;
                userData.buffs.expMultiplierEndTime = endTime.toISOString();
            } else {
                userData.buffs.pointsMultiplier = 2;
                userData.buffs.pointsMultiplierEndTime = endTime.toISOString();
            }
            break;
            
        case 'points':
            userData.points += reward.value;
            showPointsNotification(reward.value);
            break;
            
        case 'exp':
            addExperience(reward.value);
            break;
            
        case 'special':
            // Handle special rewards (can be implemented later)
            showSpecialRewardNotification(reward.value);
            break;
    }
    
    updateUserData(userData);
}

// Function to add experience
function addExperience(exp) {
    const userData = getLatestUserData();
    const multiplier = checkAndUpdateBuffs(userData).expMultiplier;
    const totalExp = exp * multiplier;
    
    userData.exp += totalExp;
    showExpNotification(totalExp);
    
    // Check for level up
    const newLevel = Math.floor(userData.exp / REWARDS.EXP_PER_LEVEL) + 1;
    if (newLevel > userData.level) {
        const levelsGained = newLevel - userData.level;
        userData.level = newLevel;
        userData.points += REWARDS.LEVEL_UP.points * levelsGained;
        showLevelUpNotification(newLevel, REWARDS.LEVEL_UP.points * levelsGained);
    }
    
    updateUserData(userData);
}

// Function to check and update buffs
function checkAndUpdateBuffs(userData) {
    const now = new Date();
    
    if (userData.buffs.expMultiplierEndTime && new Date(userData.buffs.expMultiplierEndTime) < now) {
        userData.buffs.expMultiplier = 1;
        userData.buffs.expMultiplierEndTime = null;
    }
    
    if (userData.buffs.pointsMultiplierEndTime && new Date(userData.buffs.pointsMultiplierEndTime) < now) {
        userData.buffs.pointsMultiplier = 1;
        userData.buffs.pointsMultiplierEndTime = null;
    }
    
    return userData.buffs;
}

// Function to update user data
function updateUserData(userData) {
    const allUsers = JSON.parse(sessionStorage.getItem('allUsers')) || [];
    const userIndex = allUsers.findIndex(u => u.id === userData.id);
    
    if (userIndex !== -1) {
        allUsers[userIndex] = userData;
    } else {
        allUsers.push(userData);
    }
    
    sessionStorage.setItem('allUsers', JSON.stringify(allUsers));
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
}

// Function to show experience notification
function showExpNotification(exp) {
    const notification = document.createElement('div');
    notification.className = 'exp-notification notification';
    notification.innerHTML = `+${exp} EXP`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Function to show level up notification
function showLevelUpNotification(newLevel, bonusPoints) {
    const notification = document.createElement('div');
    notification.className = 'level-up-notification notification';
    notification.innerHTML = `
        🎉 Level Up! 🎉<br>
        Level ${newLevel}<br>
        +${bonusPoints} bonus points
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to show special reward notification
function showSpecialRewardNotification(rewardNumber) {
    const notification = document.createElement('div');
    notification.className = 'special-reward-notification notification';
    notification.innerHTML = `🎁 Special Reward ${rewardNumber} Unlocked!`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to show lucky wheel popup
function showLuckyWheelPopup() {
    const popup = document.getElementById('luckyWheelPopup');
    const overlay = document.getElementById('popupOverlay');
    popup.classList.add('show');
    overlay.classList.add('show');
}

// Function to handle wheel spin
function handleWheelSpin() {
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spinButton');
    
    // Disable the spin button
    spinButton.disabled = true;
    
    // Calculate random rotation (3600 degrees = 10 full rotations + the actual reward position)
    const baseRotation = 3600;
    const random = Math.random() * 100;
    let sum = 0;
    let rewardRotation = 0;
    
    for (const reward of LUCKY_WHEEL_REWARDS) {
        sum += reward.chance;
        if (random <= sum) {
            // Calculate the middle position of the current reward segment
            rewardRotation = (sum - (reward.chance / 2)) * 3.6; // 3.6 = 360/100
            break;
        }
    }
    
    // Apply the rotation
    const totalRotation = baseRotation + rewardRotation;
    wheel.style.transform = `rotate(${totalRotation}deg)`;
    
    // After animation completes
    setTimeout(() => {
        spinLuckyWheel();
        
        // Hide the popup after a delay
        setTimeout(() => {
            const popup = document.getElementById('luckyWheelPopup');
            const overlay = document.getElementById('popupOverlay');
            popup.classList.remove('show');
            overlay.classList.remove('show');
        }, 2000);
    }, 3000);
}

// Function to update buff timers
function updateBuffTimers() {
    const userData = getLatestUserData();
    const buffIndicator = document.getElementById('buffIndicator');
    const expBuff = document.getElementById('expBuff');
    const pointsBuff = document.getElementById('pointsBuff');
    const expBuffTimer = document.getElementById('expBuffTimer');
    const pointsBuffTimer = document.getElementById('pointsBuffTimer');
    
    let hasActiveBuff = false;
    
    if (userData.buffs.expMultiplierEndTime) {
        const timeLeft = new Date(userData.buffs.expMultiplierEndTime) - new Date();
        if (timeLeft > 0) {
            hasActiveBuff = true;
            expBuff.style.display = 'block';
            expBuffTimer.textContent = formatBuffTime(timeLeft);
        } else {
            expBuff.style.display = 'none';
        }
    } else {
        expBuff.style.display = 'none';
    }
    
    if (userData.buffs.pointsMultiplierEndTime) {
        const timeLeft = new Date(userData.buffs.pointsMultiplierEndTime) - new Date();
        if (timeLeft > 0) {
            hasActiveBuff = true;
            pointsBuff.style.display = 'block';
            pointsBuffTimer.textContent = formatBuffTime(timeLeft);
        } else {
            pointsBuff.style.display = 'none';
        }
    } else {
        pointsBuff.style.display = 'none';
    }
    
    buffIndicator.style.display = hasActiveBuff ? 'block' : 'none';
}

// Function to format buff time remaining
function formatBuffTime(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

// Function to claim rewards
function claimRewards(assignmentId) {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const submission = assignment.submissions.find(sub => sub.studentId === currentUser.id);
    if (!submission || !submission.approved || submission.rewardClaimed) return;

    // Mark rewards as claimed
    submission.rewardClaimed = true;
    
    // Add experience and points
    const userData = getLatestUserData();
    addExperience(REWARDS.ON_TIME_SUBMISSION.exp);
    userData.points += REWARDS.ON_TIME_SUBMISSION.points;
    userData.onTimeSubmissions++;
    
    // Check for lucky wheel eligibility
    if (userData.onTimeSubmissions % 10 === 0) {
        showLuckyWheelPopup();
    }
    
    // Update storage
    localStorage.setItem('assignments', JSON.stringify(assignments));
    updateUserData(userData);
    refreshData();
}

// Add styles for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        right: 20px;
        padding: 1rem;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        animation: slideIn 0.3s ease-out;
        z-index: 1000;
    }

    .points-notification {
        background: linear-gradient(45deg, #28a745, #20c997);
        top: 80px;
    }

    .exp-notification {
        background: linear-gradient(45deg, #1a73e8, #4285f4);
        top: 140px;
    }

    .level-up-notification {
        background: linear-gradient(45deg, #f4b400, #fbbc04);
        top: 200px;
        text-align: center;
        line-height: 1.5;
    }

    .special-reward-notification {
        background: linear-gradient(45deg, #ea4335, #ff6d00);
        top: 300px;
    }

    .feedback-section {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-gray);
    }

    .feedback-btn {
        background: var(--primary-blue);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.3s;
    }

    .feedback-btn:hover {
        background: var(--secondary-blue);
    }

    .feedback-form {
        margin-top: 1rem;
        background: var(--light-gray);
        padding: 1rem;
        border-radius: 8px;
    }

    .feedback-textarea {
        width: 100%;
        min-height: 100px;
        padding: 0.75rem;
        border: 1px solid var(--border-gray);
        border-radius: 4px;
        margin-bottom: 1rem;
        font-family: inherit;
        resize: vertical;
    }

    .feedback-textarea:focus {
        outline: none;
        border-color: var(--primary-blue);
    }

    .submit-feedback-btn {
        background: var(--success-green);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.3s;
    }

    .submit-feedback-btn:hover {
        background: #218838;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(notificationStyles);

function createAssignmentCard(assignment) {
    const card = document.createElement('div');
    card.className = 'assignment-card';
    
    // Check if student has submitted this assignment
    const submission = assignment.submissions?.find(sub => sub.studentId === currentUser.id);
    const hasSubmitted = !!submission;
    
    card.innerHTML = `
        <div class="assignment-header">
            <h3 class="assignment-title">${assignment.title}</h3>
            <span class="due-date">Due: ${new Date(assignment.dueDate).toLocaleDateString()}</span>
        </div>
        <p class="assignment-description">${assignment.description}</p>
        ${hasSubmitted ? `
            <div class="submission-status">
                <span class="status-badge ${submission.approved ? 'approved' : 'pending'}">
                    ${submission.approved ? '✓ Approved' : '⏳ Pending Review'}
                </span>
                <button class="feedback-btn">Provide Feedback</button>
                <div class="feedback-form">
                    <textarea class="feedback-textarea" placeholder="Enter your feedback about this assignment..."></textarea>
                    <button class="submit-feedback-btn">Submit Feedback</button>
                </div>
            </div>
        ` : `
            <div class="submission-form">
                <textarea class="submission-textarea" placeholder="Enter your submission..."></textarea>
                <button class="submit-btn" onclick="submitAssignment(${assignment.id})">Submit Assignment</button>
            </div>
        `}
    `;

    // Add feedback functionality if the assignment has been submitted
    if (hasSubmitted) {
        const feedbackBtn = card.querySelector('.feedback-btn');
        const feedbackForm = card.querySelector('.feedback-form');
        const submitFeedbackBtn = card.querySelector('.submit-feedback-btn');
        const feedbackTextarea = card.querySelector('.feedback-textarea');

        feedbackBtn.addEventListener('click', () => {
            feedbackForm.classList.toggle('active');
            if (feedbackForm.classList.contains('active')) {
                feedbackBtn.textContent = 'Cancel Feedback';
            } else {
                feedbackBtn.textContent = 'Provide Feedback';
                feedbackTextarea.value = '';
            }
        });

        submitFeedbackBtn.addEventListener('click', async () => {
            const feedback = feedbackTextarea.value.trim();
            if (!feedback) {
                alert('Please enter your feedback before submitting.');
                return;
            }

            try {
                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        assignmentId: assignment.id,
                        studentId: currentUser.id,
                        studentName: currentUser.name,
                        feedback: feedback,
                        timestamp: new Date().toISOString()
                    })
                });

                if (response.ok) {
                    alert('Feedback submitted successfully!');
                    feedbackForm.classList.remove('active');
                    feedbackBtn.textContent = 'Provide Feedback';
                    feedbackTextarea.value = '';
                } else {
                    throw new Error('Failed to submit feedback');
                }
            } catch (error) {
                console.error('Error submitting feedback:', error);
                alert('Failed to submit feedback. Please try again.');
            }
        });
    }

    return card;
}

function toggleFeedbackForm(assignmentId) {
    const feedbackForm = document.getElementById(`feedback-form-${assignmentId}`);
    const feedbackBtn = feedbackForm.previousElementSibling;
    
    if (feedbackForm.style.display === 'none') {
        feedbackForm.style.display = 'block';
        feedbackBtn.textContent = 'Cancel Feedback';
    } else {
        feedbackForm.style.display = 'none';
        feedbackBtn.textContent = 'Provide Feedback';
        feedbackForm.querySelector('.feedback-textarea').value = '';
    }
}

async function submitFeedback(assignmentId) {
    const feedbackForm = document.getElementById(`feedback-form-${assignmentId}`);
    const feedbackText = feedbackForm.querySelector('.feedback-textarea').value.trim();
    
    if (!feedbackText) {
        alert('Please enter your feedback before submitting.');
        return;
    }

    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                assignmentId: assignmentId,
                studentId: currentUser.id,
                studentName: currentUser.name,
                feedback: feedbackText,
                timestamp: new Date().toISOString()
            })
        });

        if (response.ok) {
            alert('Feedback submitted successfully!');
            toggleFeedbackForm(assignmentId);
        } else {
            throw new Error('Failed to submit feedback');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Failed to submit feedback. Please try again.');
    }
} 