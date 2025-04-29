const express = require('express');
const { DayOff } = require('../models'); // Import DayOff model
// Note: We assume 'authenticateToken' middleware is applied when mounting these routes in server.js

const router = express.Router();

// --- GET All Days Off (for the logged-in user) ---
router.get('/', async (req, res) => {
  const userId = req.user.id; // Get userId from authenticated token payload
  try {
    console.log(`[GET /api/days-off] Fetching days off for user ID: ${userId}`);
    const daysOff = await DayOff.findAll({
      where: { userId: userId }, // Filter by the logged-in user's ID
      order: [['date', 'ASC']] // Order by date
    });
    res.status(200).json(daysOff);
  } catch (error) {
    console.error(`Error fetching days off for user ${userId}:`, error);
    res.status(500).json({ message: 'Server error fetching days off.', error: error.message });
  }
});

// --- POST (Add) a new Day Off (for the logged-in user) ---
router.post('/', async (req, res) => {
  const { date, reason } = req.body;
  const userId = req.user.id; // Get userId from authenticated token payload

  // Basic validation
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'Valid date (YYYY-MM-DD) is required.' });
  }

  try {
    // Check if this date already exists *for this specific user*
    // The unique constraint in the DB handles this, but checking first provides a better error message.
    console.log(`[POST /api/days-off] Checking if day off exists for user ${userId} on date ${date}`);
    const existingDayOff = await DayOff.findOne({
        where: {
            date: date,
            userId: userId // Check includes userId
        }
     });
    if (existingDayOff) {
        return res.status(409).json({ message: `Date ${date} is already marked as a day off for this user.` });
    }

    console.log(`[POST /api/days-off] Creating day off for user ${userId} on date ${date}`);
    const newDayOff = await DayOff.create({
      date,
      reason: reason || null, // Allow optional reason
      userId: userId // Associate with the logged-in user
    });
    res.status(201).json(newDayOff);

  } catch (error) {
    console.error(`Error adding day off for user ${userId}:`, error);
    // Handle potential unique constraint errors if the check above somehow missed it
    if (error.name === 'SequelizeUniqueConstraintError') {
         return res.status(409).json({ message: `Date ${date} is already marked as a day off for this user.` });
    }
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(err => err.message);
        return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ message: 'Server error adding day off.', error: error.message });
  }
});

// --- DELETE a Day Off by Date (for the logged-in user) ---
// Using date in the URL parameter (YYYY-MM-DD)
router.delete('/:date', async (req, res) => {
    const dateToDelete = req.params.date;
    const userId = req.user.id; // Get userId from authenticated token payload

     // Validate date format
    if (!dateToDelete || !/^\d{4}-\d{2}-\d{2}$/.test(dateToDelete)) {
        return res.status(400).json({ message: 'Valid date (YYYY-MM-DD) parameter is required.' });
    }

    try {
        console.log(`[DELETE /api/days-off] Attempting to delete day off for user ${userId} on date: ${dateToDelete}`);
        // Ensure deletion only happens if the date AND userId match
        const result = await DayOff.destroy({
            where: {
                date: dateToDelete,
                userId: userId // Add userId to the where clause
            }
        });

        if (result === 0) {
            // This means no row matched the date AND the userId
            console.log(`[DELETE /api/days-off] Day off not found for user ${userId} on date: ${dateToDelete}`);
            return res.status(404).json({ message: 'Day off not found for this date or permission denied.' });
        }

        console.log(`[DELETE /api/days-off] Successfully deleted day off for user ${userId} on date: ${dateToDelete}`);
        res.status(204).send(); // No Content

    } catch (error) {
        console.error(`[DELETE /api/days-off] Error deleting day off for user ${userId} on date: ${dateToDelete}`, error);
        res.status(500).json({ message: 'Server error deleting day off.', error: error.message });
    }
});

module.exports = router;

