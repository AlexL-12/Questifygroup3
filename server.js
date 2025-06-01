const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Store feedback in a JSON file
const FEEDBACK_FILE = 'feedback.json';

// Initialize feedback file if it doesn't exist
if (!fs.existsSync(FEEDBACK_FILE)) {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify([]));
}

// API endpoint to submit feedback
app.post('/api/feedback', (req, res) => {
    try {
        const feedback = req.body;
        const feedbacks = JSON.parse(fs.readFileSync(FEEDBACK_FILE));
        
        // Add timestamp if not provided
        if (!feedback.timestamp) {
            feedback.timestamp = new Date().toISOString();
        }
        
        feedbacks.push(feedback);
        fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2));
        
        res.json({ success: true, message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error saving feedback:', error);
        res.status(500).json({ success: false, message: 'Failed to save feedback' });
    }
});

// API endpoint to get feedback
app.get('/api/feedback', (req, res) => {
    try {
        const feedbacks = JSON.parse(fs.readFileSync(FEEDBACK_FILE));
        res.json(feedbacks);
    } catch (error) {
        console.error('Error reading feedback:', error);
        res.status(500).json({ success: false, message: 'Failed to read feedback' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 