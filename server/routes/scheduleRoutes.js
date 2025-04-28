const express = require('express');
const { User } = require('../models'); // Import User model
const db = require('../models');

const router = express.Router();

// --- GET /api/schedule/regular ---
router.get('/regular', async (req, res) => {
    const userId = req.user.id;
    try {
        console.log(`[GET /api/schedule/regular] Fetching schedule for user ID: ${userId}`);
        // Fetch the full user object initially to ensure schedule data is loaded if present
        const user = await User.findByPk(userId);
        if (!user) {
            console.error(`[GET /api/schedule/regular] User not found for ID: ${userId}`);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(`[GET /api/schedule/regular] Raw schedule data from DB for user ${userId}:`, user.regularScheduleData);
        res.status(200).json(user.regularScheduleData || {});
    } catch (error) {
        console.error(`Error fetching schedule for user ${userId}:`, error);
        res.status(500).json({ message: 'Failed to fetch schedule', error: error.message });
    }
});


// --- PUT /api/schedule/regular ---
// Using user.save() with explicit change tracking
router.put('/regular', async (req, res) => {
    const userId = req.user.id;
    const newSchedule = req.body;
    let user; // Define user in the outer scope

    if (!newSchedule || typeof newSchedule !== 'object') {
        return res.status(400).json({ message: 'Invalid schedule data format.' });
    }
    console.log(`[PUT /api/schedule/regular] Received schedule update for user ${userId}:`);

    try {
        // Fetch the full user object first
        user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`[PUT /api/schedule/regular] User found. Data BEFORE assignment:`, user.regularScheduleData);
        // Assign the new schedule data
        user.regularScheduleData = newSchedule;
        console.log(`[PUT /api/schedule/regular] Data AFTER assignment, BEFORE save:`, user.regularScheduleData);

        // Explicitly mark the JSONB field as changed
        user.changed('regularScheduleData', true);

        // Attempt to save the instance
        try {
            console.log(`[PUT /api/schedule/regular] Attempting user.save() for user ${userId}...`);
            await user.save(); // Attempt to save changes on the instance
            console.log(`[PUT /api/schedule/regular] user.save() completed WITHOUT throwing error for user ${userId}.`);
        } catch (saveError) {
            console.error(`[PUT /api/schedule/regular] !!! ERROR during user.save() for user ${userId}:`, saveError);
            throw saveError; // Re-throw to be caught by outer catch
        }

        // --- Refetch to verify persistence ---
        // Explicitly request the attribute again after saving
        const updatedUser = await User.findByPk(userId, {
            attributes: ['regularScheduleData'] // Explicitly select the column
        });
        const savedData = updatedUser ? updatedUser.regularScheduleData : null;
        console.log(`[PUT /api/schedule/regular] Data AFTER save (refetched):`, savedData);
        // --- End Refetch ---

        console.log(`[PUT /api/schedule/regular] Save processing completed for user ${userId}.`);
        // Respond with the refetched data to be absolutely sure
        res.status(200).json(savedData || {});

    } catch (error) {
        // Catch errors from findByPk or re-thrown from saveError
        console.error(`Error updating schedule for user ${userId} (outer catch):`, error);
        res.status(500).json({ message: 'Failed to update schedule', error: error.message });
    }
});

// --- Other potential routes ---
module.exports = router;

