// server/routes/classRoutes.js
const express = require('express');
const { Class, User, Textbook } = require('../models');

const router = express.Router();

// --- GET All Classes for the logged-in user ---
router.get('/', async (req, res) => {
  const userId = req.user.id;
  try {
    const classes = await Class.findAll({
      where: { userId: userId },
      include: [{
          model: Textbook,
          as: 'textbooks',
          attributes: ['id', 'title'],
          through: { attributes: [] }
      }],
      // Order primarily by type (numbered first), then year/number or name
      order: [
          ['classType', 'ASC'], // 'numbered' comes before 'special'
          ['yearLevel', 'ASC'],
          ['classNumber', 'ASC'],
          ['className', 'ASC']
      ]
    });
    res.status(200).json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ message: 'Server error fetching classes.', error: error.message });
  }
});

// --- POST (Add) a new Class ---
router.post('/', async (req, res) => {
  // Expect classType and relevant fields based on type
  const { classType, classNumber, yearLevel, className } = req.body;
  const userId = req.user.id;
  let dataToCreate = { userId, classType };
  let validationError = null;
  let yearLvl = null; // Declare yearLvl here

  // --- Input Validation ---
  if (!classType || (classType !== 'numbered' && classType !== 'special')) {
      validationError = 'Invalid class type specified.';
  } else {
      // Validate Year Level if provided (optional for special, required for numbered)
      if (yearLevel) {
          yearLvl = parseInt(yearLevel, 10);
          if (isNaN(yearLvl) || yearLvl < 1 || yearLvl > 6) {
              validationError = 'Year Level must be between 1 and 6.';
          } else {
              dataToCreate.yearLevel = yearLvl.toString(); // Add validated yearLevel
          }
      }

      if (!validationError) { // Proceed if yearLevel is valid or not provided
          if (classType === 'numbered') {
              if (!classNumber || !yearLevel) { // Year level is required for numbered
                  validationError = 'Class Number and Year Level are required for numbered classes.';
              } else {
                  const classNum = parseInt(classNumber, 10);
                  if (isNaN(classNum) || classNum < 1 || classNum > 15) {
                      validationError = 'Class Number must be between 1 and 15.';
                  } else {
                      dataToCreate.classNumber = classNum.toString();
                      dataToCreate.className = null; // Ensure className is null
                  }
              }
          } else if (classType === 'special') {
              if (!className || className.trim() === '') {
                  validationError = 'Class Name is required for special classes.';
              } else {
                  dataToCreate.className = className.trim();
                  dataToCreate.classNumber = null; // Ensure number is null
                  // yearLevel might have been set above if provided
              }
          }
      }
  }


  if (validationError) {
      return res.status(400).json({ message: validationError });
  }
  // --- End Validation ---

  try {
    // Optional: Check for duplicates based on type
    let existingClass = null;
    if (dataToCreate.classType === 'numbered') {
        existingClass = await Class.findOne({ where: { userId, classType: 'numbered', yearLevel: dataToCreate.yearLevel, classNumber: dataToCreate.classNumber } });
        if (existingClass) return res.status(409).json({ message: `Numbered class ${dataToCreate.yearLevel}-${dataToCreate.classNumber} already exists.` });
    } else { // Special class
         // Check uniqueness for special class name *within the same year level if provided* or globally if not
         const whereClause = { userId, classType: 'special', className: dataToCreate.className };
         // if (dataToCreate.yearLevel) { // Optional: Make special names unique per year level
         //     whereClause.yearLevel = dataToCreate.yearLevel;
         // }
         existingClass = await Class.findOne({ where: whereClause });
         if (existingClass) return res.status(409).json({ message: `Special class named "${dataToCreate.className}" already exists${dataToCreate.yearLevel ? ` for Year ${dataToCreate.yearLevel}` : ''}.` });
    }

    // Create the new class
    const newClass = await Class.create(dataToCreate);

    // Refetch with the association using the alias
    const classWithTextbooks = await Class.findByPk(newClass.id, {
        include: [{ model: Textbook, as: 'textbooks', attributes: ['id', 'title'], through: { attributes: [] } }]
    });
    res.status(201).json(classWithTextbooks || newClass);

  } catch (error) { /* ... error handling ... */ }
});

// --- DELETE a Class for the logged-in user ---
router.delete('/:id', async (req, res) => {
    const classId = req.params.id;
    const userId = req.user.id;
    try {
        const classToDelete = await Class.findOne({ where: { id: classId, userId: userId } });
        if (!classToDelete) {
            return res.status(404).json({ message: 'Class not found or you do not have permission to delete it.' });
        }
        await classToDelete.destroy(); // CASCADE delete should handle ClassTextbooks entries
        res.status(204).send();
    } catch (error) {
        console.error(`[DELETE /api/classes] Error deleting class ID: ${classId}`, error);
        res.status(500).json({ message: 'Server error deleting class.', error: error.message });
    }
});

// --- Link/Unlink Routes ---
router.post('/:classId/textbooks/:textbookId', async (req, res) => {
    const { classId, textbookId } = req.params;
    const userId = req.user.id;
    try {
        const targetClass = await Class.findOne({ where: { id: classId, userId: userId } });
        if (!targetClass) return res.status(404).json({ message: 'Class not found or permission denied.' });
        // Prevent linking to special classes if desired
        if (targetClass.classType === 'special') {
            return res.status(400).json({ message: 'Cannot link textbooks to special classes.' });
        }
        const targetTextbook = await Textbook.findByPk(textbookId);
        if (!targetTextbook) return res.status(404).json({ message: 'Textbook not found.' });

        await targetClass.addTextbook(targetTextbook);

        console.log(`Linked textbook ${textbookId} to class ${classId}`);
        const updatedClassWithTextbooks = await Class.findByPk(classId, {
             include: [{ model: Textbook, as: 'textbooks', attributes: ['id', 'title'], through: { attributes: [] } }]
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

router.delete('/:classId/textbooks/:textbookId', async (req, res) => {
    const { classId, textbookId } = req.params;
    const userId = req.user.id;
     try {
        const targetClass = await Class.findOne({ where: { id: classId, userId: userId } });
        if (!targetClass) return res.status(404).json({ message: 'Class not found or permission denied.' });
        const targetTextbook = await Textbook.findByPk(textbookId);
        if (!targetTextbook) return res.status(404).json({ message: 'Textbook not found.' });

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
