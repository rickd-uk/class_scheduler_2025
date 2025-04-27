// server/routes/classRoutes.js
const express = require('express');
// Import models needed, including Textbook for associations
const { Class, User, Textbook } = require('../models');

const router = express.Router();

// --- GET All Classes for the logged-in user ---
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const classes = await Class.findAll({
      where: { userId: userId },
      // Include associated textbooks using the explicit alias
      include: [{
          model: Textbook,
          as: 'textbooks', // Use the alias matching the Class model definition
          attributes: ['id', 'title'], // Only include id and title of textbooks
          through: { attributes: [] } // Don't include attributes from the join table
      }],
      order: [['yearLevel', 'ASC'], ['classNumber', 'ASC']]
    });
    res.status(200).json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    // Send back the specific error message from Sequelize if available
    res.status(500).json({ message: 'Server error fetching classes.', error: error.message });
  }
});

// --- POST (Add) a new Class for the logged-in user ---
router.post('/', async (req, res) => {
  const { classNumber, yearLevel } = req.body;
  const userId = req.user.id;

  // Input Validation
  if (!classNumber || !yearLevel) {
    return res.status(400).json({ message: 'Class Number and Year Level are required.' });
  }
  const classNum = parseInt(classNumber, 10);
  if (isNaN(classNum) || classNum < 1 || classNum > 15) {
      return res.status(400).json({ message: 'Class Number must be between 1 and 15.' });
  }
  const yearLvl = parseInt(yearLevel, 10);
   if (isNaN(yearLvl) || yearLvl < 1 || yearLvl > 6) {
      return res.status(400).json({ message: 'Year Level must be between 1 and 6.' });
  }

  try {
    // Check if class already exists
    const existingClass = await Class.findOne({
        where: {
            classNumber: classNum.toString(),
            yearLevel: yearLvl.toString(),
            userId: userId
        }
    });
    if (existingClass) {
        return res.status(409).json({ message: `Class ${classNum} for Year ${yearLvl} already exists.` });
    }

    // Create the new class
    const newClass = await Class.create({
      classNumber: classNum.toString(),
      yearLevel: yearLvl.toString(),
      userId: userId
    });

    // Refetch with the association using the alias
    const classWithTextbooks = await Class.findByPk(newClass.id, {
        include: [{
            model: Textbook,
            as: 'textbooks', // Use the alias here too
            attributes: ['id', 'title'],
            through: { attributes: [] }
        }]
    });
    res.status(201).json(classWithTextbooks || newClass); // Send back with textbooks association if found

  } catch (error) {
    console.error("Error adding class:", error);
    // Error handling
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
        const classToDelete = await Class.findOne({ where: { id: classId, userId: userId } });
        if (!classToDelete) {
            return res.status(404).json({ message: 'Class not found or permission denied.' });
        }
        await classToDelete.destroy(); // CASCADE delete should handle ClassTextbooks entries
        res.status(204).send();
    } catch (error) {
        console.error(`[DELETE /api/classes] Error deleting class ID: ${classId}`, error);
        res.status(500).json({ message: 'Server error deleting class.', error: error.message });
    }
});

// --- Link a Textbook to a Class ---
router.post('/:classId/textbooks/:textbookId', async (req, res) => {
    const { classId, textbookId } = req.params;
    const userId = req.user.id;
    try {
        const targetClass = await Class.findOne({ where: { id: classId, userId: userId } });
        if (!targetClass) return res.status(404).json({ message: 'Class not found or permission denied.' });
        const targetTextbook = await Textbook.findByPk(textbookId);
        if (!targetTextbook) return res.status(404).json({ message: 'Textbook not found.' });

        // Use the Sequelize helper method (uses the alias internally if defined)
        await targetClass.addTextbook(targetTextbook);

        console.log(`Linked textbook ${textbookId} to class ${classId}`);
        // Return the updated class with its textbooks, using the alias
        const updatedClassWithTextbooks = await Class.findByPk(classId, {
             include: [{
                 model: Textbook,
                 as: 'textbooks', // Use the alias
                 attributes: ['id', 'title'],
                 through: { attributes: [] }
             }]
        });
        res.status(200).json(updatedClassWithTextbooks);
    } catch (error) {
         if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(409).json({ message: 'This textbook is already linked to this class.' });
         }
        console.error(`Error linking textbook ${textbookId} to class ${classId}:`, error);
        res.status(500).json({ message: 'Server error linking textbook.', error: error.message });
    }
});

// --- Unlink a Textbook from a Class ---
router.delete('/:classId/textbooks/:textbookId', async (req, res) => {
    const { classId, textbookId } = req.params;
    const userId = req.user.id;
     try {
        const targetClass = await Class.findOne({ where: { id: classId, userId: userId } });
        if (!targetClass) return res.status(404).json({ message: 'Class not found or permission denied.' });
        const targetTextbook = await Textbook.findByPk(textbookId);
        if (!targetTextbook) return res.status(404).json({ message: 'Textbook not found.' });

        // Use the Sequelize helper method (uses the alias internally if defined)
        const result = await targetClass.removeTextbook(targetTextbook);

        if (result === 0) console.log(`Link between textbook ${textbookId} and class ${classId} did not exist.`);
        else console.log(`Unlinked textbook ${textbookId} from class ${classId}`);
        res.status(204).send();
    } catch (error) {
        console.error(`Error unlinking textbook ${textbookId} from class ${classId}:`, error);
        res.status(500).json({ message: 'Server error unlinking textbook.', error: error.message });
    }
});

module.exports = router;

