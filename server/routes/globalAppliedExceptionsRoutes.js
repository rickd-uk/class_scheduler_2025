// server/routes/globalAppliedExceptionsRoutes.js
const express = require("express");
const { GlobalAppliedException, ExceptionPattern } = require("../models");
const router = express.Router();
// Note: authenticateToken and isAdmin middleware should be applied in server.js

// GET all globally applied exceptions
router.get("/", async (req, res) => {
  try {
    const applied = await GlobalAppliedException.findAll({
      include: [
        {
          model: ExceptionPattern,
          required: true,
          attributes: ["id", "name", "patternData"],
        },
      ], // Inner join to ensure pattern exists
      order: [["date", "ASC"]],
    });
    res.status(200).json(applied);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching globally applied exceptions",
      error: error.message,
    });
  }
});

// POST to apply a pattern globally to a date
router.post("/", async (req, res) => {
  const { date, exceptionPatternId, reason } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: "Valid date required." });
  }
  if (!exceptionPatternId) {
    return res.status(400).json({ message: "exceptionPatternId is required." });
  }
  try {
    // Use findOrCreate to prevent duplicates for the same date
    const [applied, created] = await GlobalAppliedException.findOrCreate({
      where: { date },
      defaults: { date, exceptionPatternId, reason: reason || null },
    });
    if (!created) {
      // If it already existed, update it
      applied.exceptionPatternId = exceptionPatternId;
      applied.reason = reason || null;
      await applied.save();
    }
    // Refetch with pattern data
    const result = await GlobalAppliedException.findByPk(applied.id, {
      include: [
        {
          model: ExceptionPattern,
          required: true,
          attributes: ["id", "name", "patternData"],
        },
      ],
    });
    res.status(created ? 201 : 200).json(result);
  } catch (error) {
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({ message: "Invalid Exception Pattern ID." });
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: `An exception is already applied globally to ${date}.`,
      });
    }
    res.status(500).json({
      message: "Error applying global exception",
      error: error.message,
    });
  }
});

// DELETE a globally applied exception for a date
router.delete("/:date", async (req, res) => {
  const { date } = req.params;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: "Valid date parameter required." });
  }
  try {
    const result = await GlobalAppliedException.destroy({ where: { date } });
    if (result === 0) {
      return res.status(404).json({
        message: "No globally applied exception found for this date.",
      });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      message: "Error clearing globally applied exception",
      error: error.message,
    });
  }
});

module.exports = router;
