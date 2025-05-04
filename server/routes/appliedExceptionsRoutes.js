const express = require('express');
const { AppliedException, ExceptionPattern } = require('../models');
const router = express.Router();

// --- GET /api/applied-exceptions ---
// Fetches all applied exceptions for the logged-in user
router.get('/', async (req, res) => {
    const userId = req.user.id; // Get user ID from token payload
    try {
        console.log(`[GET /api/applied-exceptions] Fetching all applied exceptions for user ${userId}`);
        const applied = await AppliedException.findAll({
            where: { userId }, // Filter by user ID
            // Include the associated pattern details
            include: [{
                model: ExceptionPattern,
                required: false, // Use LEFT JOIN to include even if pattern ID is null
                attributes: ['id', 'name', 'patternData'] // Specify needed pattern attributes
            }],
            order: [['date', 'ASC']] // Order by date
        });
        console.log(`[GET /api/applied-exceptions] Found ${applied.length} exceptions for user ${userId}`);
        res.status(200).json(applied); // Send the array of exceptions
    } catch (error) {
        console.error(`Error fetching all applied exceptions for user ${userId}:`, error);
        res.status(500).json({ message: 'Error fetching applied exceptions', error: error.message });
    }
});


// GET applied exception for a specific date
// e.g., GET /api/applied-exceptions/2025-05-15
router.get('/:date', async (req, res) => {
    const userId = req.user.id;
    const { date } = req.params;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Valid date parameter (YYYY-MM-DD) is required.' });
    }
    try {
        const applied = await AppliedException.findOne({
            where: { userId, date },
            // Include the pattern details if an ID is present
            include: [{ model: ExceptionPattern, required: false }] // Left join
        });
        res.status(200).json(applied); // Will be null if no exception applied
    } catch (error) { res.status(500).json({ message: 'Error fetching applied exception', error: error.message }); }
});

// POST to apply an exception pattern or mark day off for a date
// Body: { date: 'YYYY-MM-DD', exceptionPatternId: id | null, isDayOff: boolean, reason: string | null, color: string | null }
router.post('/', async (req, res) => {
    const userId = req.user.id;
    const { date, exceptionPatternId, isDayOff, reason, color } = req.body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Valid date (YYYY-MM-DD) is required.' });
    }
    if (!isDayOff && !exceptionPatternId) {
         return res.status(400).json({ message: 'Either exceptionPatternId must be provided or isDayOff must be true.' });
    }
    if (isDayOff && exceptionPatternId) {
         return res.status(400).json({ message: 'Cannot apply a pattern and mark as day off simultaneously.' });
    }
    // Optional: Validate color format
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
        return res.status(400).json({ message: 'Invalid color format. Use hex #RRGGBB.' });
    }


    try {
        // Use findOrCreate to handle both creating and updating in one go
        const [appliedException, created] = await AppliedException.findOrCreate({
            where: { userId, date },
            defaults: {
                userId,
                date,
                exceptionPatternId: isDayOff ? null : exceptionPatternId,
                isDayOff: isDayOff || false,
                reason: reason || null,
                color: isDayOff ? (color || '#F0F0F0') : null // Only store color if it's a day off exception
            }
        });

        if (!created) { // If it existed, update it
            console.log(`Updating existing applied exception for ${date}, user ${userId}`);
            appliedException.exceptionPatternId = isDayOff ? null : exceptionPatternId;
            appliedException.isDayOff = isDayOff || false;
            appliedException.reason = reason !== undefined ? reason : null; // Allow clearing reason
            appliedException.color = isDayOff ? (color !== undefined ? color : '#F0F0F0') : null; // Update/clear color only if day off
            await appliedException.save();
        }

        // Refetch with associated pattern to return full details
        const result = await AppliedException.findByPk(appliedException.id, {
             include: [{ model: ExceptionPattern, required: false, attributes: ['id', 'name', 'patternData'] }]
        });

        res.status(created ? 201 : 200).json(result);

    } catch (error) {
        console.error(`Error applying exception for user ${userId} on date ${date}:`, error);
         if (error.name === 'SequelizeForeignKeyConstraintError') {
             return res.status(400).json({ message: 'Invalid Exception Pattern ID provided.' });
        }
        res.status(500).json({ message: 'Error applying exception', error: error.message });
    }
});

// DELETE applied exception for a specific date
router.delete('/:date', async (req, res) => {
    const userId = req.user.id;
    const { date } = req.params;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Valid date parameter (YYYY-MM-DD) is required.' });
    }
    try {
        const result = await AppliedException.destroy({ where: { userId, date } });
        if (result === 0) { return res.status(404).json({ message: 'No applied exception found for this date.' }); }
        res.status(204).send();
    } catch (error) { res.status(500).json({ message: 'Error clearing applied exception', error: error.message }); }
});


module.exports = router;

