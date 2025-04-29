const express = require('express');
const { DayOff } = require('../models'); // Import DayOff model
// Note: We assume 'authenticateToken' middleware is applied when mounting these routes in server.js
// which provides req.user

const router = express.Router();

// --- GET All Days Off (for the logged-in user) ---
// Handles GET requests to /api/days-off/
router.get('/', async (req, res) => {
  // Extract user ID from the request object (attached by authenticateToken middleware)
  const userId = req.user.id;
  try {
    console.log(`[GET /api/days-off] Fetching days off for user ID: ${userId}`);
    // Find all DayOff entries matching the logged-in user's ID
    const daysOff = await DayOff.findAll({
      where: { userId: userId }, // Filter results by userId
      // Include the color field in the response
      attributes: ['id', 'date', 'reason', 'color', 'createdAt', 'updatedAt', 'userId'],
      order: [['date', 'ASC']] // Order the results by date ascending
    });
    // Send the found days off as a JSON response
    res.status(200).json(daysOff);
  } catch (error) {
    // Log and handle any errors during the database query
    console.error(`Error fetching days off for user ${userId}:`, error);
    res.status(500).json({ message: 'Server error fetching days off.', error: error.message });
  }
});

// --- POST (Add) a new Day Off (for the logged-in user) ---
// Handles POST requests to /api/days-off/
router.post('/', async (req, res) => {
  // Extract date, reason, and color from the request body
  const { date, reason, color } = req.body;
  // Extract user ID from the authenticated request
  const userId = req.user.id;

  // --- Input Validation ---
  // Validate the date format (YYYY-MM-DD)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'Valid date (YYYY-MM-DD) is required.' });
  }
  // Optional: Validate color format (#RRGGBB)
  if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
       return res.status(400).json({ message: 'Invalid color format. Use hex #RRGGBB.' });
  }
  // --- End Validation ---

  try {
    // Check if this specific date already exists for this user to prevent duplicates
    // (Database unique constraint also handles this, but checking first gives a clearer error)
    console.log(`[POST /api/days-off] Checking if day off exists for user ${userId} on date ${date}`);
    const existingDayOff = await DayOff.findOne({
        where: {
            date: date,
            userId: userId // Ensure check is user-specific
        }
     });
    // If it exists, return a conflict error
    if (existingDayOff) {
        return res.status(409).json({ message: `Date ${date} is already marked as a day off for this user.` });
    }

    // Create the new DayOff entry in the database
    console.log(`[POST /api/days-off] Creating day off for user ${userId} on date ${date}`);
    const newDayOff = await DayOff.create({
      date,
      reason: reason || null, // Allow reason to be optional (defaults to null)
      color: color || '#F0F0F0', // Use provided color or default grey
      userId: userId // Associate with the logged-in user
    });
    // Send the newly created day off object back as confirmation
    res.status(201).json(newDayOff);

  } catch (error) {
    // Handle potential errors during creation
    console.error(`Error adding day off for user ${userId}:`, error);
    // Handle specific database errors (like unique constraint violation if check failed)
    if (error.name === 'SequelizeUniqueConstraintError') {
         return res.status(409).json({ message: `Date ${date} is already marked as a day off for this user.` });
    }
    // Handle validation errors defined in the model
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(err => err.message);
        return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    // Generic server error for other issues
    res.status(500).json({ message: 'Server error adding day off.', error: error.message });
  }
});

// --- PUT (Update) a Day Off by Date (for the logged-in user) ---
// Handles PUT requests to /api/days-off/:date (e.g., /api/days-off/2025-05-10)
router.put('/:date', async (req, res) => {
    const dateToUpdate = req.params.date; // Get date from URL parameter
    // Extract reason and color from request body (only these are updatable for now)
    const { reason, color } = req.body;
    const userId = req.user.id; // Get user ID from token

    // Validate date format from parameter
    if (!dateToUpdate || !/^\d{4}-\d{2}-\d{2}$/.test(dateToUpdate)) {
        return res.status(400).json({ message: 'Valid date (YYYY-MM-DD) parameter is required.' });
    }
    // Optional: Validate color format if provided
     if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
         return res.status(400).json({ message: 'Invalid color format. Use hex #RRGGBB.' });
     }

    try {
        console.log(`[PUT /api/days-off] Attempting to update day off for user ${userId} on date: ${dateToUpdate}`);
        // Find the specific day off entry for this user and date
        const dayOffToUpdate = await DayOff.findOne({
            where: {
                date: dateToUpdate,
                userId: userId
            }
        });

        // If no matching entry found, return 404
        if (!dayOffToUpdate) {
            console.log(`[PUT /api/days-off] Day off not found for user ${userId} on date: ${dateToUpdate}`);
            return res.status(404).json({ message: 'Day off not found for this date or permission denied.' });
        }

        // Update the reason and color fields
        // Use !== undefined check to allow explicitly setting reason/color to null or empty string
        dayOffToUpdate.reason = reason !== undefined ? reason : dayOffToUpdate.reason;
        dayOffToUpdate.color = color !== undefined ? color : dayOffToUpdate.color;

        // Save the changes to the database
        await dayOffToUpdate.save();
        console.log(`[PUT /api/days-off] Successfully updated day off for user ${userId} on date: ${dateToUpdate}`);
        // Return the updated record
        res.status(200).json(dayOffToUpdate);

    } catch (error) {
        // Handle potential errors during update
        console.error(`[PUT /api/days-off] Error updating day off for user ${userId} on date: ${dateToUpdate}`, error);
         if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        res.status(500).json({ message: 'Server error updating day off.', error: error.message });
    }
});


// --- DELETE a Day Off by Date (for the logged-in user) ---
// Handles DELETE requests to /api/days-off/:date (e.g., /api/days-off/2025-05-10)
router.delete('/:date', async (req, res) => {
    const dateToDelete = req.params.date; // Get date from URL parameter
    const userId = req.user.id; // Get user ID from token payload

     // Validate date format from parameter
    if (!dateToDelete || !/^\d{4}-\d{2}-\d{2}$/.test(dateToDelete)) {
        return res.status(400).json({ message: 'Valid date (YYYY-MM-DD) parameter is required.' });
    }

    try {
        console.log(`[DELETE /api/days-off] Attempting to delete day off for user ${userId} on date: ${dateToDelete}`);
        // Destroy the DayOff entry matching both the date and the userId
        const result = await DayOff.destroy({
            where: {
                date: dateToDelete,
                userId: userId // Ensure only the correct user's entry is deleted
            }
        });

        // Check if any rows were actually deleted
        if (result === 0) {
            // This means no row matched the date AND the userId
            console.log(`[DELETE /api/days-off] Day off not found for user ${userId} on date: ${dateToDelete}`);
            return res.status(404).json({ message: 'Day off not found for this date or permission denied.' });
        }

        // Deletion successful
        console.log(`[DELETE /api/days-off] Successfully deleted day off for user ${userId} on date: ${dateToDelete}`);
        res.status(204).send(); // Send No Content success status

    } catch (error) {
        // Handle potential errors during deletion
        console.error(`[DELETE /api/days-off] Error deleting day off for user ${userId} on date: ${dateToDelete}`, error);
        res.status(500).json({ message: 'Server error deleting day off.', error: error.message });
    }
});

module.exports = router; // Export the router for use in server.js

