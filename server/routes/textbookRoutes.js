const express = require('express');
const { Textbook } = require('../models'); // Import Textbook model
// Note: No authentication middleware applied here yet, add if needed later

const router = express.Router();

// --- GET All Textbooks ---
router.get('/', async (req, res) => {
  try {
    const textbooks = await Textbook.findAll({
      order: [['title', 'ASC']] // Order alphabetically by title
    });
    res.status(200).json(textbooks);
  } catch (error) {
    console.error("Error fetching textbooks:", error);
    res.status(500).json({ message: 'Server error fetching textbooks.', error: error.message });
  }
});

// --- POST (Add) a new Textbook ---
router.post('/', async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Textbook title is required.' });
  }

  try {
    const newTextbook = await Textbook.create({
      title,
      description: description || null
    });
    res.status(201).json(newTextbook);
  } catch (error) {
    console.error("Error adding textbook:", error);
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(err => err.message);
        return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ message: 'Server error adding textbook.', error: error.message });
  }
});

// --- PUT (Update) a Textbook ---
router.put('/:id', async (req, res) => {
    const textbookId = req.params.id;
    const { title, description } = req.body;

    // Basic validation
    if (!title) {
        return res.status(400).json({ message: 'Textbook title cannot be empty.' });
    }

    try {
        console.log(`[PUT /api/textbooks] Attempting to update textbook ID: ${textbookId}`);
        const textbookToUpdate = await Textbook.findByPk(textbookId);

        if (!textbookToUpdate) {
            console.log(`[PUT /api/textbooks] Textbook not found. ID: ${textbookId}`);
            return res.status(404).json({ message: 'Textbook not found.' });
        }

        // Update the fields
        textbookToUpdate.title = title;
        textbookToUpdate.description = description || null; // Allow clearing description

        await textbookToUpdate.save(); // Save changes
        console.log(`[PUT /api/textbooks] Successfully updated textbook ID: ${textbookId}`);
        res.status(200).json(textbookToUpdate); // Return the updated textbook

    } catch (error) {
        console.error(`[PUT /api/textbooks] Error updating textbook ID: ${textbookId}`, error);
         if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: messages });
        }
        res.status(500).json({ message: 'Server error updating textbook.', error: error.message });
    }
});


// --- DELETE a Textbook ---
router.delete('/:id', async (req, res) => {
    const textbookId = req.params.id;

    try {
        console.log(`[DELETE /api/textbooks] Attempting to delete textbook ID: ${textbookId}`);
        const textbookToDelete = await Textbook.findByPk(textbookId);

        if (!textbookToDelete) {
            console.log(`[DELETE /api/textbooks] Textbook not found. ID: ${textbookId}`);
            return res.status(404).json({ message: 'Textbook not found.' });
        }

        // Note: Consider implications if textbook is linked to classes.
        // The 'CASCADE' onDelete in the join table migration handles removing links.
        await textbookToDelete.destroy();
        console.log(`[DELETE /api/textbooks] Successfully deleted textbook ID: ${textbookId}`);
        res.status(204).send(); // No Content

    } catch (error) {
        console.error(`[DELETE /api/textbooks] Error deleting textbook ID: ${textbookId}`, error);
        res.status(500).json({ message: 'Server error deleting textbook.', error: error.message });
    }
});


// --- Add routes for GET /:id later ---
// --- Add routes for linking/unlinking to classes later ---

module.exports = router;

