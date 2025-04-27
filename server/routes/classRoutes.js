const express = require('express');
const { Class, User } = require('../models'); // Import Class and User models

const router = express.Router();

// --- GET All Classes for the logged-in user ---
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const classes = await Class.findAll({
      where: { userId: userId },
      // Order by year level, then class number
      order: [['yearLevel', 'ASC'], ['classNumber', 'ASC']]
    });
    res.status(200).json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ message: 'Server error fetching classes.', error: error.message });
  }
});

// --- POST (Add) a new Class for the logged-in user ---
router.post('/', async (req, res) => {
  // Expect classNumber and yearLevel instead of name/subject/gradeLevel
  const { classNumber, yearLevel } = req.body;
  const userId = req.user.id;

  // --- Input Validation ---
  if (!classNumber || !yearLevel) {
    return res.status(400).json({ message: 'Class Number and Year Level are required.' });
  }

  // Validate classNumber (1-15)
  const classNum = parseInt(classNumber, 10);
  if (isNaN(classNum) || classNum < 1 || classNum > 15) {
      return res.status(400).json({ message: 'Class Number must be between 1 and 15.' });
  }

  // Validate yearLevel (1-6)
  const yearLvl = parseInt(yearLevel, 10);
   if (isNaN(yearLvl) || yearLvl < 1 || yearLvl > 6) {
      return res.status(400).json({ message: 'Year Level must be between 1 and 6.' });
  }
  // --- End Validation ---

  try {
    // Optional: Check if this specific class (number + year) already exists for the user
    const existingClass = await Class.findOne({
        where: {
            classNumber: classNum.toString(), // Store as string if model uses STRING
            yearLevel: yearLvl.toString(), // Store as string if model uses STRING
            userId: userId
        }
    });
    if (existingClass) {
        return res.status(409).json({ message: `Class ${classNum} for Year ${yearLvl} already exists.` });
    }

    // Create the new class
    const newClass = await Class.create({
      classNumber: classNum.toString(), // Store as string
      yearLevel: yearLvl.toString(), // Store as string
      userId: userId
    });

    res.status(201).json(newClass);

  } catch (error) {
    console.error("Error adding class:", error);
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(err => err.message);
        return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ message: 'Server error adding class.', error: error.message });
  }
});

// --- DELETE a Class for the logged-in user ---
router.delete('/:id', async (req, res) => {
    const classId = req.params.id;
    const userId = req.user.id;

    try {
        console.log(`[DELETE /api/classes] Attempting to delete class ID: ${classId} for user ID: ${userId}`);
        const classToDelete = await Class.findOne({
            where: {
                id: classId,
                userId: userId
            }
        });

        if (!classToDelete) {
            console.log(`[DELETE /api/classes] Class not found or user mismatch. Class ID: ${classId}, User ID: ${userId}`);
            return res.status(404).json({ message: 'Class not found or you do not have permission to delete it.' });
        }

        await classToDelete.destroy();
        console.log(`[DELETE /api/classes] Successfully deleted class ID: ${classId}`);
        res.status(204).send();

    } catch (error) {
        console.error(`[DELETE /api/classes] Error deleting class ID: ${classId}`, error);
        res.status(500).json({ message: 'Server error deleting class.', error: error.message });
    }
});


// --- Add routes for GET /:id, PUT /:id later ---

module.exports = router;

