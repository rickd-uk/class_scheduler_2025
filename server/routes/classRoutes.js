const express = require('express');
const { Class, User } = require('../models'); // Import Class and User models

const router = express.Router();

// --- GET All Classes for the logged-in user ---
router.get('/', async (req, res) => {
  try {
    // req.user is attached by the authenticateToken middleware
    const userId = req.user.id;

    const classes = await Class.findAll({
      where: { userId: userId },
      order: [['name', 'ASC']] // Order alphabetically by name
      // include: [{ model: User, as: 'teacher', attributes: ['username'] }] // Optional: include teacher username
    });

    res.status(200).json(classes);

  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ message: 'Server error fetching classes.', error: error.message });
  }
});

// --- POST (Add) a new Class for the logged-in user ---
router.post('/', async (req, res) => {
  const { name, subject, gradeLevel } = req.body;
  const userId = req.user.id; // Get user ID from authenticated token payload

  // Basic validation
  if (!name) {
    return res.status(400).json({ message: 'Class name is required.' });
  }

  try {
    const newClass = await Class.create({
      name,
      subject,
      gradeLevel,
      userId: userId // Associate class with the logged-in user
    });

    res.status(201).json(newClass);

  } catch (error) {
    console.error("Error adding class:", error);
     // Check for Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(err => err.message);
        return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ message: 'Server error adding class.', error: error.message });
  }
});

// --- Add routes for GET /:id, PUT /:id, DELETE /:id later ---

module.exports = router;

