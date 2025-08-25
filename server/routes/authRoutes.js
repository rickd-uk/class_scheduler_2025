const express = require("express");
const { User, GlobalSetting } = require("../models");
const jwt = require("jsonwebtoken");

const router = express.Router();

// --- Registration ---
router.post("/register", async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // Check if registration is allowed
    const globalSettings = await GlobalSetting.findOne();
    if (!globalSettings || globalSettings.allowRegistration === false) {
      return res
        .status(403)
        .json({ message: "Registration is currently disabled." });
    }

    // Check for existing users
    if (email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser)
        return res.status(409).json({ message: "Email already in use." });
    }
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername)
      return res.status(409).json({ message: "Username already taken." });

    // --- !! NEW LOGIC: Check if this is the first user !! ---
    const userCount = await User.count();
    const isAdmin = userCount === 0; // If no users exist, this user is an admin

    // Create user with the determined admin status
    const newUser = await User.create({ username, email, password, isAdmin });

    // --- Generate JWT for immediate login ---
    const tokenPayload = {
      id: newUser.id,
      username: newUser.username,
      isAdmin: newUser.isAdmin,
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || "1d",
    });

    res.status(201).json({ user: newUser.toJSON(), token });
  } catch (error) {
    next(error);
  }
});

// --- Login ---
router.post("/login", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });

    if (!user || !(await user.isValidPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || "1d",
    });

    console.log(
      `Login successful for ${user.username}, isAdmin: ${user.isAdmin}`,
    );
    res.status(200).json({ user: user.toJSON(), token });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
