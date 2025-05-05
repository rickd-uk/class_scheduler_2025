// server/routes/globalDaysOffRoutes.js
const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const isAdmin = require("../middleware/isAdmin");

const { GlobalDayOff } = require("../models");
const router = express.Router();
// Note: authenticateToken and isAdmin middleware should be applied in server.js

// GET all global days off
router.get("/", authenticateToken, async (req, res) => {
  try {
    const daysOff = await GlobalDayOff.findAll({ order: [["date", "ASC"]] });
    res.status(200).json(daysOff);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching global days off",
      error: error.message,
    });
  }
});

// POST a new global day off
router.post("/", authenticateToken, isAdmin, async (req, res) => {
  const { date, reason, color } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res
      .status(400)
      .json({ message: "Valid date (YYYY-MM-DD) is required." });
  }
  if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
    return res.status(400).json({ message: "Invalid color format." });
  }
  try {
    const newDayOff = await GlobalDayOff.create({
      date,
      reason: reason || null,
      color: color || "#E0E0E0",
    });
    res.status(201).json(newDayOff);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: `Date ${date} is already a global day off.` });
    }
    res
      .status(500)
      .json({ message: "Error adding global day off", error: error.message });
  }
});

// PUT (update) a global day off
router.put("/:date", authenticateToken, isAdmin, async (req, res) => {
  const { date } = req.params;
  const { reason, color } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: "Valid date parameter required." });
  }
  if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
    return res.status(400).json({ message: "Invalid color format." });
  }
  try {
    const dayOff = await GlobalDayOff.findOne({ where: { date } });
    if (!dayOff) {
      return res.status(404).json({ message: "Global day off not found." });
    }
    dayOff.reason = reason !== undefined ? reason : dayOff.reason;
    dayOff.color = color !== undefined ? color : dayOff.color;
    await dayOff.save();
    res.status(200).json(dayOff);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating global day off", error: error.message });
  }
});

// DELETE a global day off
router.delete("/:date", authenticateToken, isAdmin, async (req, res) => {
  const { date } = req.params;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: "Valid date parameter required." });
  }
  try {
    const result = await GlobalDayOff.destroy({ where: { date } });
    if (result === 0) {
      return res.status(404).json({ message: "Global day off not found." });
    }
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting global day off", error: error.message });
  }
});

module.exports = router;
