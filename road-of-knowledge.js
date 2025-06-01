// Check if user is logged in
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'index.html';
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

// Get assignments from localStorage
let assignments = JSON.parse(localStorage.getItem('assignments')) || [];

// Constants
const EXP_PER_LEVEL = 500;
const MILESTONES = [
    { exp: 0, title: 'Start' },
    { exp: 100, title: 'First Steps' },
    { exp: 250, title: 'Growing' },
    { exp: 500, title: 'Level Up!' }
];

// Achievement definitions
const ACHIEVEMENTS = [
    {
        id: 'first_steps',
        icon: '👣',
        title: 'First Steps',
        description: 'Submit your first assignment on time',
        requirement: 1,
        points: 50,
        type: 'ontime_submissions'
    },
    {
        id: 'getting_started',
        icon: '🌱',
        title: 'Getting Started',
        description: 'Submit 5 assignments on time',
        requirement: 5,
        points: 100,
        type: 'ontime_submissions'
    },
    {
        id: 'dedicated_learner',
        icon: '📚',
        title: 'Dedicated Learner',
        description: 'Submit 10 assignments on time',
        requirement: 10,
        points: 200,
        type: 'ontime_submissions'
    },
    {
        id: 'academic_star',
        icon: '⭐',
        title: 'Academic Star',
        description: 'Submit 20 assignments on time',
        requirement: 20,
        points: 500,
        type: 'ontime_submissions'
    },
    {
        id: 'exp_collector',
        icon: '📈',
        title: 'EXP Collector',
        description: 'Reach 1000 EXP',
        requirement: 1000,
        points: 200,
        type: 'exp'
    },
    {
        id: 'knowledge_seeker',
        icon: '🎯',
        title: 'Knowledge Seeker',
        description: 'Reach level 3',
        requirement: 3,
        points: 300,
        type: 'level'
    },
    {
        id: 'lucky_spinner',
        icon: '🎡',
        title: 'Lucky Spinner',
        description: 'Spin the lucky wheel 3 times',
        requirement: 3,
        points: 150,
        type: 'wheel_spins'
    },
    {
        id: 'buff_master',
        icon: '⚡',
        title: 'Buff Master',
        description: 'Have both EXP and Points buffs active at the same time',
        requirement: 1,
        points: 250,
        type: 'active_buffs'
    }
];

// Initialize the page
function initializePage() {
    updateStats();
    updateRoad();
    updateAchievements();
    updateBuffs();
    displayPendingRewards();
}

// Update statistics
function updateStats() {
    document.getElementById('totalPoints').textContent = currentUser.points || 0;
    document.getElementById('totalExp').textContent = currentUser.exp || 0;
    document.getElementById('onTimeSubmissions').textContent = currentUser.onTimeSubmissions || 0;
    
    const currentLevel = Math.floor(currentUser.exp / EXP_PER_LEVEL) + 1;
    const currentExp = currentUser.exp % EXP_PER_LEVEL;
    
    document.getElementById('currentLevel').textContent = currentLevel;
    document.getElementById('currentExp').textContent = currentExp;
    document.getElementById('nextLevelExp').textContent = EXP_PER_LEVEL;
}

// Update road progress
function updateRoad() {
    const currentExp = currentUser.exp % EXP_PER_LEVEL;
    
    const milestonesContainer = document.getElementById('milestones');
    milestonesContainer.innerHTML = MILESTONES.map((milestone, index) => {
        const position = (milestone.exp / EXP_PER_LEVEL) * 100;
        const isCompleted = currentExp >= milestone.exp;
        const isCurrent = index > 0 && currentExp >= MILESTONES[index - 1].exp && currentExp < milestone.exp;
        
        return `
            <div class="milestone ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}"
                 style="left: ${position}%">
                ${isCompleted ? '✓' : index + 1}
                <div class="milestone-info">
                    ${milestone.title}<br>
                    ${milestone.exp} EXP
                </div>
            </div>
        `;
    }).join('');
}

// Update achievements
function updateAchievements() {
    const achievementsGrid = document.getElementById('achievementsGrid');
    achievementsGrid.innerHTML = ACHIEVEMENTS.map(achievement => {
        const progress = calculateAchievementProgress(achievement);
        const isCompleted = progress >= achievement.requirement;
        
        return `
            <div class="achievement-card ${isCompleted ? 'completed' : ''}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-progress">
                    <div class="achievement-progress-bar" 
                         style="width: ${Math.min(100, (progress / achievement.requirement) * 100)}%">
                    </div>
                </div>
                <div class="achievement-status">
                    ${progress}/${achievement.requirement} ${
                        isCompleted ? '(Completed)' : ''
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Calculate achievement progress
function calculateAchievementProgress(achievement) {
    switch (achievement.type) {
        case 'ontime_submissions':
            return currentUser.onTimeSubmissions || 0;
        case 'exp':
            return currentUser.exp || 0;
        case 'level':
            return Math.floor((currentUser.exp || 0) / EXP_PER_LEVEL) + 1;
        case 'wheel_spins':
            return currentUser.wheelSpins || 0;
        case 'active_buffs':
            return (currentUser.buffs?.expMultiplier > 1 && currentUser.buffs?.pointsMultiplier > 1) ? 1 : 0;
        default:
            return 0;
    }
}

// Update buff displays
function updateBuffs() {
    const buffIndicator = document.getElementById('buffIndicator');
    const expBuff = document.getElementById('expBuff');
    const pointsBuff = document.getElementById('pointsBuff');
    const expBuffTimer = document.getElementById('expBuffTimer');
    const pointsBuffTimer = document.getElementById('pointsBuffTimer');
    
    let hasActiveBuff = false;
    
    if (currentUser.buffs?.expMultiplierEndTime) {
        const timeLeft = new Date(currentUser.buffs.expMultiplierEndTime) - new Date();
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
    
    if (currentUser.buffs?.pointsMultiplierEndTime) {
        const timeLeft = new Date(currentUser.buffs.pointsMultiplierEndTime) - new Date();
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

// Format buff time remaining
function formatBuffTime(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

// Function to get pending rewards
function getPendingRewards() {
    const pendingRewards = [];
    
    // Check for unclaimed level-up rewards
    const currentLevel = Math.floor(currentUser.exp / REWARDS.EXP_PER_LEVEL) + 1;
    const claimedLevels = currentUser.claimedLevels || [];
    for (let level = 1; level < currentLevel; level++) {
        if (!claimedLevels.includes(level)) {
            pendingRewards.push({
                type: 'level_up',
                level: level + 1,
                points: REWARDS.LEVEL_UP.points
            });
        }
    }

    return pendingRewards;
}

// Function to display pending rewards
function displayPendingRewards() {
    const pendingRewards = getPendingRewards();
    const container = document.createElement('div');
    container.className = 'pending-rewards-container';
    
    if (pendingRewards.length > 0) {
        container.innerHTML = `
            <h2 class="section-title">🎁 Level Up Rewards</h2>
            <div class="pending-rewards-grid">
                ${pendingRewards.map(reward => `
                    <div class="reward-card">
                        <div class="reward-header">
                            <span class="reward-icon">⭐</span>
                            <h3>Level Up Bonus</h3>
                        </div>
                        <p class="reward-title">Reached Level ${reward.level}</p>
                        <div class="reward-details">
                            <span>+${reward.points} Points</span>
                        </div>
                        <button onclick="claimLevelUpReward(${reward.level})" class="claim-btn">
                            Claim Reward
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Insert after the stats container
        const statsContainer = document.querySelector('.stats-container');
        statsContainer.parentNode.insertBefore(container, statsContainer.nextSibling);
    }
}

// Function to claim level up reward
function claimLevelUpReward(level) {
    if (!currentUser.claimedLevels) {
        currentUser.claimedLevels = [];
    }
    
    if (!currentUser.claimedLevels.includes(level)) {
        currentUser.claimedLevels.push(level);
        currentUser.points += REWARDS.LEVEL_UP.points;
        updateUserData();
        refreshPage();
    }
}

// Function to update user data
function updateUserData() {
    const allUsers = JSON.parse(sessionStorage.getItem('allUsers')) || [];
    const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        allUsers[userIndex] = currentUser;
    } else {
        allUsers.push(currentUser);
    }
    
    sessionStorage.setItem('allUsers', JSON.stringify(allUsers));
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// Function to refresh the page
function refreshPage() {
    assignments = JSON.parse(localStorage.getItem('assignments')) || [];
    initializePage();
}

// Add styles for new elements
const style = document.createElement('style');
style.textContent = `
    .pending-rewards-container {
        margin: 2rem 0;
    }

    .pending-rewards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .reward-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .reward-header {
        margin-bottom: 1rem;
    }

    .reward-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        display: block;
    }

    .reward-title {
        color: var(--primary-blue);
        margin: 0.5rem 0;
    }

    .reward-details {
        display: flex;
        gap: 1rem;
        margin: 1rem 0;
        color: #666;
    }

    .claim-btn {
        background: var(--primary-blue);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.3s;
    }

    .claim-btn:hover {
        background: var(--secondary-blue);
    }
`;
document.head.appendChild(style);

// Initial page load
initializePage();

// Set up periodic refresh
setInterval(() => {
    const updatedUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (updatedUser && updatedUser.id === currentUser.id) {
        Object.assign(currentUser, updatedUser);
        refreshPage();
    }
}, 2000); 