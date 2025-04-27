const express = require('express');
const { User } = require('../models'); // Import User model
const db = require('../models'); // Import db for potential direct access or transactions

const router = express.Router();

// Note: All routes defined here will be automatically prefixed with '/api/schedule'
// because of how we mount it in server.js.
// They also already have the 'authenticateToken' middleware applied from server.js.

// --- PUT /api/schedule/regular ---
// Updates the regular weekly schedule for the logged-in user
router.put('/regular', async (req, res) => {
    const userId = req.user.id; // Get user from token payload (attached by middleware)
    const newSchedule = req.body; // Get schedule data from request body

    // Optional: Add validation for the structure of newScheduleData here
    if (!newSchedule || typeof newSchedule !== 'object') {
        return res.status(400).json({ message: 'Invalid schedule data format.' });
    }

    console.log(`[PUT /api/schedule/regular] Received schedule update for user ${userId}:`);
    // Basic logging of received data structure (kept for debugging)
    Object.keys(newSchedule).forEach(day => {
        console.log(`  ${day}:`, newSchedule[day]?.map(item => item?.classId || 'null').join(', '));
    });

    try {
        // --- Find the user by primary key (ID) ---
        const user = await User.findByPk(userId);

        // --- Handle case where user is not found ---
        if (!user) {
            console.error(`[PUT /api/schedule/regular] User not found for ID: ${userId}`);
            return res.status(404).json({ message: 'User not found' });
        }

        // --- Update the schedule data column ---
        // Assign the entire schedule object received from the client
        // to the JSONB column in the database.
        user.regularScheduleData = newSchedule;

        // --- Save the updated user record ---
        await user.save();
        console.log(`[PUT /api/schedule/regular] Saved schedule for user ${userId}.`);

        // Send back the saved schedule data as confirmation
        res.status(200).json(user.regularScheduleData); // Return the actual saved data

    } catch (error) {
        console.error(`Error updating schedule for user ${userId}:`, error);
        res.status(500).json({ message: 'Failed to update schedule', error: error.message });
    }
});

// --- Add routes for fetching schedule, managing exceptions later ---
// GET /regular - Fetch the regular schedule
// GET /exceptions - Fetch daily exceptions
// POST /exceptions - Add/update a daily exception
// DELETE /exceptions/:date - Delete an exception

module.exports = router;

