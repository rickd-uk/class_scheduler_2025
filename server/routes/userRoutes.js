const express = require("express");
const { User } = require("../models");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

// --- Change Password ---
router.put("/change-password", authenticateToken, async (req, res, next) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long.",
      });
    }

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify current password
    const isValidPassword = await user.isValidPassword(currentPassword);
    if (!isValidPassword) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    }

    // Update password (will be hashed by the beforeSave hook)
    user.password = newPassword;
    await user.save();

    console.log(`Password changed successfully for user: ${user.username}`);
    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    next(error);
  }
});

module.exports = router;
