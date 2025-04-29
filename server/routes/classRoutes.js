const express = require('express');
const { Class, User, Textbook } = require('../models');

const router = express.Router();

// --- GET All Classes for the logged-in user ---
router.get('/', async (req, res) => {
  const userId = req.user.id;
  try {
    const classes = await Class.findAll({
      where: { userId: userId },
      // *** Include color in the attributes to be returned ***
      attributes: ['id', 'classNumber', 'yearLevel', 'classType', 'className', 'color', 'createdAt', 'updatedAt', 'userId'],
      include: [{
          model: Textbook,
          as: 'textbooks',
          attributes: ['id', 'title'],
          through: { attributes: [] }
      }],
      order: [
          ['classType', 'ASC'],
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

// --- POST (Add) a new Class for the logged-in user ---
router.post('/', async (req, res) => {
  // *** Destructure color from req.body ***
  const { classType, classNumber, yearLevel, className, color } = req.body;
  const userId = req.user.id;
  // *** Include color in dataToCreate, provide default ***
  let dataToCreate = { userId, classType, color: color || '#FFFFFF' };
  let validationError = null;
  let yearLvl = null;

  // --- Input Validation ---
  if (!classType || (classType !== 'numbered' && classType !== 'special')) {
      validationError = 'Invalid class type specified.';
  } else {
      if (yearLevel) {
          yearLvl = parseInt(yearLevel, 10);
          if (isNaN(yearLvl) || yearLvl < 1 || yearLvl > 6) {
              validationError = 'Year Level must be between 1 and 6.';
          } else {
              dataToCreate.yearLevel = yearLvl.toString();
          }
      }

      if (!validationError) {
          if (classType === 'numbered') {
              if (!classNumber || !yearLevel) {
                  validationError = 'Class Number and Year Level are required for numbered classes.';
              } else {
                  const classNum = parseInt(classNumber, 10);
                  if (isNaN(classNum) || classNum < 1 || classNum > 15) {
                      validationError = 'Class Number must be between 1 and 15.';
                  } else {
                      dataToCreate.classNumber = classNum.toString();
                      dataToCreate.className = null;
                  }
              }
          } else if (classType === 'special') {
              if (!className || className.trim() === '') {
                  validationError = 'Class Name is required for special classes.';
              } else {
                  dataToCreate.className = className.trim();
                  dataToCreate.classNumber = null;
              }
          }
      }
       // *** Optional: Validate color format (#RRGGBB) ***
      if (!validationError && color && !/^#[0-9A-F]{6}$/i.test(color)) {
           validationError = 'Invalid color format. Use hex #RRGGBB.';
      }
  }

  if (validationError) {
      return res.status(400).json({ message: validationError });
  }
  // --- End Validation & Assignment ---

  try {
    // Check for duplicates (omitted for brevity)
    // ...

    // Create the new class including color
    const newClass = await Class.create(dataToCreate);

    // Refetch with the association using the alias
    const classWithTextbooks = await Class.findByPk(newClass.id, {
        // Include color when refetching
        attributes: ['id', 'classNumber', 'yearLevel', 'classType', 'className', 'color', 'createdAt', 'updatedAt', 'userId'],
        include: [{ model: Textbook, as: 'textbooks', attributes: ['id', 'title'], through: { attributes: [] } }]
    });
    res.status(201).json(classWithTextbooks || newClass);

  } catch (error) {
    console.error("Error adding class:", error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const messages = error.errors?.map(err => err.message) || [error.message];
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
        // Removed check preventing linking to special classes
        const targetTextbook = await Textbook.findByPk(textbookId);
        if (!targetTextbook) return res.status(404).json({ message: 'Textbook not found.' });

        await targetClass.addTextbook(targetTextbook);

        console.log(`Linked textbook ${textbookId} to class ${classId}`);
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

// --- TODO: Add PUT /:id route for editing classes (including color) ---

module.exports = router;

