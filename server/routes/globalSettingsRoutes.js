// server/routes/globalSettingsRoutes.js
const express = require("express");
const { GlobalSetting } = require("../models");
const authenticateToken = require("../middleware/authenticateToken"); // Needed for PUT
const isAdmin = require("../middleware/isAdmin"); // Needed for PUT
const router = express.Router();

// GET current registration status
router.get("/registration-status", authenticateToken, async (req, res) => {
  try {
    // Assuming a single row or a known way to identify the correct setting row
    const setting = await GlobalSetting.findOne({
      // attributes: ['allowRegistration']
      // Add a WHERE clause if needed, e.g., where: { id: 1 }
    });
    if (!setting) {
      // If no setting found, default to a sensible value or create one
      return res.json({ allowRegistration: true }); // Or false
    }
    res.json({ allowRegistration: setting.allowRegistration });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching registration status",
      error: error.message,
    });
  }
});

// PUT apply global days off
router.put(
  "/apply-global-days-off",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { applyGlobalDaysOff } = req.body;
      console.log("[Apply Global Days Off] Updating to:", applyGlobalDaysOff);

      let settings = await GlobalSetting.findOne({ where: { id: 1 } });
      if (!settings) {
        return res.status(404).json({ message: "Global settings not found." });
      }

      settings.applyGlobalDaysOff = applyGlobalDaysOff;
      await settings.save();

      res.json({
        message: "Apply global days off updated",
        applyGlobalDaysOff: settings.applyGlobalDaysOff,
      });
    } catch (error) {
      console.error("[Apply Global Days Off] Error:", error);
      res
        .status(500)
        .json({ message: "Error updating setting", error: error.message });
    }
  },
);

// PUT apply global exceptions
router.put(
  "/apply-global-exceptions",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { applyGlobalExceptions } = req.body;
      console.log(
        "[Apply Global Exceptions] Updating to:",
        applyGlobalExceptions,
      );

      let settings = await GlobalSetting.findOne({ where: { id: 1 } });
      if (!settings) {
        return res.status(404).json({ message: "Global settings not found." });
      }

      settings.applyGlobalExceptions = applyGlobalExceptions;
      await settings.save();

      res.json({
        message: "Apply global exceptions updated",
        applyGlobalExceptions: settings.applyGlobalExceptions,
      });
    } catch (error) {
      console.error("[Apply Global Exceptions] Error:", error);
      res
        .status(500)
        .json({ message: "Error updating setting", error: error.message });
    }
  },
);

// PUT to update registration status (Admin only)
router.put(
  "/registration-status",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    const { allowRegistration } = req.body;
    if (typeof allowRegistration !== "boolean") {
      return res.status(400).json({
        message: "Invalid value for allowRegistration. Must be true or false.",
      });
    }
    try {
      // Assuming a single row or a known way to identify the correct setting row
      let setting = await GlobalSetting.findOne({
        // Add a WHERE clause if needed
      });
      if (setting) {
        setting.allowRegistration = allowRegistration;
        await setting.save();
      } else {
        // Optionally create the setting if it doesn't exist
        setting = await GlobalSetting.create({
          allowRegistration /* other default fields if necessary */,
        });
      }
      res.json({
        message: "Registration status updated successfully.",
        allowRegistration: setting.allowRegistration,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error updating registration status",
        error: error.message,
      });
    }
  },
);

// GET /api/global-settings - Fetch the current settings (accessible to all logged-in users)
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Find the first (and likely only) row
    const settings = await GlobalSetting.findOne();
    if (!settings) {
      // This shouldn't happen if seeding worked, but handle it
      console.log("No global settings found in DB, returning defaults.");
      // Return default values if not found
      return res.status(200).json({
        applyGlobalDaysOff: true,
        applyGlobalExceptions: true,
        weekly_days_off: [],
      });
    }

    // FIXED: Access the camelCase property weeklyDaysOff from the model
    res.status(200).json({
      ...settings.toJSON(),
      weekly_days_off: settings.weeklyDaysOff || [],
      hideWeeklyDaysOff: settings.hideWeeklyDaysOff || false,
    });
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

// PUT weekly days off
router.put("/weekly-days-off", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { daysOff } = req.body;

    console.log("[Weekly Days Off] Updating with:", daysOff);

    // Find or create the global settings record
    let settings = await GlobalSetting.findOne({ where: { id: 1 } });

    if (!settings) {
      console.log("[Weekly Days Off] Creating new settings record");
      settings = await GlobalSetting.create({
        id: 1,
        settingName: "default",
        weeklyDaysOff: daysOff,
      });
    } else {
      console.log("[Weekly Days Off] Updating existing settings");
      settings.weeklyDaysOff = daysOff;
      await settings.save();
    }

    console.log(
      "[Weekly Days Off] Updated successfully:",
      settings.weeklyDaysOff,
    );
    res.json({
      message: "Weekly days off updated",
      weeklyDaysOff: settings.weeklyDaysOff,
    });
  } catch (error) {
    console.error("[Weekly Days Off] Error:", error);
    res.status(500).json({
      message: "Error updating weekly days off",
      error: error.message,
    });
  }
});

// PUT hide weekly days off toggle
router.put(
  "/hide-weekly-days-off",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { hideWeeklyDaysOff } = req.body;

      console.log("[Hide Weekly Days Off] Updating to:", hideWeeklyDaysOff);

      let settings = await GlobalSetting.findOne({ where: { id: 1 } });

      if (!settings) {
        settings = await GlobalSetting.create({
          id: 1,
          settingName: "default",
          hideWeeklyDaysOff: hideWeeklyDaysOff,
        });
      } else {
        settings.hideWeeklyDaysOff = hideWeeklyDaysOff;
        await settings.save();
      }

      console.log(
        "[Hide Weekly Days Off] Updated successfully:",
        settings.hideWeeklyDaysOff,
      );
      res.json({
        message: "Hide weekly days off setting updated",
        hideWeeklyDaysOff: settings.hideWeeklyDaysOff,
      });
    } catch (error) {
      console.error("[Hide Weekly Days Off] Error:", error);
      res.status(500).json({
        message: "Error updating hide weekly days off setting",
        error: error.message,
      });
    }
  },
);

module.exports = router;
