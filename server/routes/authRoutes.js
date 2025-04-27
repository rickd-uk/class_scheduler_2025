const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Import User model

const router = express.Router();

// --- Registration ---
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  try {
    // Check if user already exists
    console.log(`[Register] Checking existence for email: ${email}`); // Log 1
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      console.log(`[Register] Email already exists: ${email}`); // Log 2
      return res.status(409).json({ message: 'Email already in use.' });
    }

    console.log(`[Register] Checking existence for username: ${username}`); // Log 3
    const existingUsername = await User.findOne({ where: { username: username } });
     if (existingUsername) {
      console.log(`[Register] Username already exists: ${username}`); // Log 4
      return res.status(409).json({ message: 'Username already taken.' });
    }

    // Create user (password hashing handled by model hook)
    let newUser;
    try {
        console.log(`[Register] Attempting User.create for: ${username}`); // Log 5 (Before create)
        newUser = await User.create({ username, email, password });
        console.log(`[Register] User.create successful for: ${username}, ID: ${newUser.id}`); // Log 6 (After create)
    } catch (createError) {
        // Catch errors specifically from User.create or its hooks
        console.error("[Register] Error during User.create:", createError); // Log 7 (Create error)
        // Check for Sequelize validation errors specifically from create
        if (createError.name === 'SequelizeValidationError') {
            const messages = createError.errors.map(err => err.message);
            return res.status(400).json({ message: 'Validation failed during user creation', errors: messages });
        }
        // Throw other errors to be caught by the outer catch block
        throw createError;
    }


    // Generate JWT Token
    console.log(`[Register] Attempting JWT sign for user ID: ${newUser.id}`); // Log 8 (Before JWT)
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    console.log(`[Register] JWT sign successful`); // Log 9 (After JWT)


    // Return user info (without password) and token
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser, // toJSON method removes password
      token: token
    });

  } catch (error) {
    // Catch errors from findOne calls or re-thrown from User.create catch block
    console.error("[Register] Outer Catch Block Error:", error); // Log 10 (Outer error)
     // Check for Sequelize validation errors (might be redundant if caught above)
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(err => err.message);
        return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
});

// --- Login ---
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    console.log(`[Login] Finding user: ${username}`);
    // Find user by username
    const user = await User.findOne({ where: { username: username } });
    if (!user) {
      console.log(`[Login] User not found: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials.' }); // User not found
    }

    console.log(`[Login] Validating password for: ${username}`);
    // Check password
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
       console.log(`[Login] Invalid password for: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials.' }); // Wrong password
    }

    console.log(`[Login] Generating token for: ${username}`);
    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    console.log(`[Login] Login successful for: ${username}`);
    // Return user info (without password) and token
    res.status(200).json({
      message: 'Login successful',
      user: user, // toJSON removes password
      token: token
    });

  } catch (error) {
    console.error("[Login] Error:", error);
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
});

module.exports = router;

