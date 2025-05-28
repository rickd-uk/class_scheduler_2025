const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, GlobalSetting } = require("../models"); // Assuming User model is in models/index.js

const router = express.Router();

// --- Registration ---
router.post("/register", async (req, res, next) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }
  // Add more validation as needed (e.g., password complexity)

  try {
    // Check if email or username already exists
    const globalSettings = await GlobalSetting.findOne();

    if (!globalSettings || globalSettings.allowRegistration === false) {
      // Explicitly check for false
      return res.status(403).json({
        message: "Registration is currently disabled by the administrator.",
      });
    }

    if (email) {
      const existingUser = await User.findOne({ where: { email: email } });
      if (existingUser) {
        return res.status(409).json({ message: "Email already in use." });
      }
    }

    const existingUsername = await User.findOne({
      where: { username: username },
    });
    if (existingUsername) {
      return res.status(409).json({ message: "Username already taken." });
    }

    // Create user (password hashing is handled by the model hook)
    const newUser = await User.create({ username, email, password });

    // --- Generate JWT for immediate login after registration ---
    const tokenPayload = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email, // Still include email in token
      isAdmin: newUser.isAdmin, // Include isAdmin status
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || "1d",
    });

    // Respond with user info (excluding password) and token
    const userResponse = newUser.toJSON(); // Use toJSON to exclude password
    // Ensure isAdmin is included in the response user object if needed by frontend immediately
    userResponse.isAdmin = newUser.isAdmin;

    res.status(201).json({ user: userResponse, token });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message);
      return res
        .status(400)
        .json({ message: "Validation failed", errors: messages });
    }
    // Pass other errors to the central error handler
    next(error);
  }
});

// --- Login ---
router.post("/login", async (req, res, next) => {
  // *** Expect username instead of email ***
  const { username, password } = req.body;

  // *** Update validation message ***
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  try {
    // *** Find user by username ***
    console.log(`Login attempt for username: ${username}`); // Log username
    // Ensure isAdmin is fetched along with other necessary fields
    const user = await User.findOne({ where: { username: username } }); // Find by username

    if (!user) {
      console.log(
        `Login attempt failed: User not found for username ${username}`,
      );
      return res.status(401).json({ message: "Invalid credentials." }); // User not found
    }

    // Validate password using instance method
    const isValid = await user.isValidPassword(password);
    if (!isValid) {
      console.log(
        `Login attempt failed: Invalid password for username ${username}`,
      );
      return res.status(401).json({ message: "Invalid credentials." }); // Incorrect password
    }

    // --- Generate JWT ---
    // Include necessary fields in the token payload
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email, // Still include email
      isAdmin: user.isAdmin, // Include the isAdmin field
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || "1d",
    });

    // Respond with user info (excluding password) and token
    const userResponse = user.toJSON();
    // *** Ensure isAdmin is included in the response user object ***
    userResponse.isAdmin = user.isAdmin;

    console.log(
      `Login successful for user ${user.id} (${user.username}), isAdmin: ${user.isAdmin}`,
    );
    res.status(200).json({ user: userResponse, token });
  } catch (error) {
    console.error("Login error:", error);
    // Pass errors to the central error handler
    next(error);
  }
});

module.exports = router;
