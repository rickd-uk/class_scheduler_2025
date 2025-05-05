// server/routes/globalSettingsRoutes.js
const express = require("express");
const { GlobalSetting } = require("../models");
const authenticateToken = require("../middleware/authenticateToken"); // Needed for PUT
const isAdmin = require("../middleware/isAdmin"); // Needed for PUT
const router = express.Router();

// GET /api/global-settings - Fetch the current settings (accessible to all logged-in users)
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Find the first (and likely only) row
    const settings = await GlobalSetting.findOne();
    if (!settings) {
      // This shouldn't happen if seeding worked, but handle it
      console.error("Global settings not found in database!");
      // Return default values if not found
      return res
        .status(200)
        .json({ applyGlobalDaysOff: true, applyGlobalExceptions: true });
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching global settings:", error);
    res.status(500).json({
      message: "Error fetching global settings",
      error: error.message,
    });
  }
});

// PUT /api/global-settings - Update the settings (Admin only)
router.put("/", authenticateToken, isAdmin, async (req, res) => {
  // Expecting { applyGlobalDaysOff: boolean, applyGlobalExceptions: boolean } in body
  const { applyGlobalDaysOff, applyGlobalExceptions } = req.body;

  // Basic validation
  if (
    typeof applyGlobalDaysOff !== "boolean" ||
    typeof applyGlobalExceptions !== "boolean"
  ) {
    return res.status(400).json({
      message:
        "Both applyGlobalDaysOff and applyGlobalExceptions booleans are required.",
    });
  }

  try {
    // Find the settings row (assuming ID 1 or just the first one)
    const settings = await GlobalSetting.findOne();
    if (!settings) {
      return res
        .status(404)
        .json({ message: "Global settings record not found." });
    }

    // Update the values
    settings.applyGlobalDaysOff = applyGlobalDaysOff;
    settings.applyGlobalExceptions = applyGlobalExceptions;
    await settings.save();

    console.log(
      `Global settings updated by admin ${req.user.id}:`,
      settings.toJSON(),
    );
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error updating global settings:", error);
    res.status(500).json({
      message: "Error updating global settings",
      error: error.message,
    });
  }
});

module.exports = router;
