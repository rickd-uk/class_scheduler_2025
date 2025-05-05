// server/routes/globalAppliedExceptionsRoutes.js
const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const isAdmin = require("../middleware/isAdmin");
const { GlobalAppliedException, ExceptionPattern } = require("../models");

const router = express.Router();

/**
 * GET /api/global-applied-exceptions
 * Fetch all globally applied exceptions (pattern + optional reason).
 * Accessible to any authenticated user.
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const applied = await GlobalAppliedException.findAll({
      include: [
        {
          model: ExceptionPattern,
          required: true,
          attributes: ["id", "name", "patternData"],
        },
      ],
      order: [["date", "ASC"]],
    });
    res.status(200).json(applied);
  } catch (error) {
    console.error("Error fetching globally applied exceptions:", error);
    res.status(500).json({
      message: "Error fetching globally applied exceptions",
      error: error.message,
    });
  }
});

/**
 * POST /api/global-applied-exceptions
 * Apply (or update) an exception pattern globally to a specific date.
 * Admin only.
 */
router.post("/", authenticateToken, isAdmin, async (req, res) => {
  const { date, exceptionPatternId, reason } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res
      .status(400)
      .json({ message: "Valid date (YYYY-MM-DD) required." });
  }
  if (!exceptionPatternId) {
    return res.status(400).json({ message: "exceptionPatternId is required." });
  }
  try {
    const [applied, created] = await GlobalAppliedException.findOrCreate({
      where: { date },
      defaults: { date, exceptionPatternId, reason: reason || null },
    });
    if (!created) {
      applied.exceptionPatternId = exceptionPatternId;
      applied.reason = reason || null;
      await applied.save();
    }
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
    console.error("Error applying global exception:", error);
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({ message: "Invalid ExceptionPattern ID." });
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

/**
 * DELETE /api/global-applied-exceptions/:date
 * Remove a globally applied exception for a given date.
 * Admin only.
 */
router.delete("/:date", authenticateToken, isAdmin, async (req, res) => {
  const { date } = req.params;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: "Valid date parameter required." });
  }
  try {
    const deleted = await GlobalAppliedException.destroy({ where: { date } });
    if (deleted === 0) {
      return res.status(404).json({
        message: "No globally applied exception found for this date.",
      });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting global exception:", error);
    res.status(500).json({
      message: "Error clearing globally applied exception",
      error: error.message,
    });
  }
});

module.exports = router;
