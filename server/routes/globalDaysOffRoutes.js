// server/routes/globalDaysOffRoutes.js
const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const isAdmin = require("../middleware/isAdmin");

const { GlobalDayOff } = require("../models");
const router = express.Router();

// GET all global days off
router.get("/", authenticateToken, async (req, res) => {
  try {
    const daysOff = await GlobalDayOff.findAll({
      order: [["startDate", "ASC"]],
    });
    res.status(200).json(daysOff);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching global days off",
      error: error.message,
    });
  }
});

// POST a new global day off (supports date ranges)
router.post("/", authenticateToken, isAdmin, async (req, res) => {
  const { startDate, endDate, reason, color } = req.body;

  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return res
      .status(400)
      .json({ message: "Valid startDate (YYYY-MM-DD) is required." });
  }

  if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return res
      .status(400)
      .json({ message: "Invalid endDate format (YYYY-MM-DD)." });
  }

  if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
    return res.status(400).json({ message: "Invalid color format." });
  }

  try {
    const newDayOff = await GlobalDayOff.create({
      startDate,
      endDate: endDate || null,
      reason: reason || null,
      color: color || "#E0E0E0",
    });
    res.status(201).json(newDayOff);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: `Date ${startDate} is already a global day off.` });
    }
    res
      .status(500)
      .json({ message: "Error adding global day off", error: error.message });
  }
});

// PUT (update) a global day off by ID
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, reason, color } = req.body;

  if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return res.status(400).json({ message: "Invalid startDate format." });
  }

  if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return res.status(400).json({ message: "Invalid endDate format." });
  }

  if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
    return res.status(400).json({ message: "Invalid color format." });
  }

  try {
    const dayOff = await GlobalDayOff.findByPk(id);
    if (!dayOff) {
      return res.status(404).json({ message: "Global day off not found." });
    }

    if (startDate !== undefined) dayOff.startDate = startDate;
    if (endDate !== undefined) dayOff.endDate = endDate;
    if (reason !== undefined) dayOff.reason = reason;
    if (color !== undefined) dayOff.color = color;

    await dayOff.save();
    res.status(200).json(dayOff);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating global day off", error: error.message });
  }
});

// DELETE a global day off by ID
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await GlobalDayOff.destroy({ where: { id } });
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
