const express = require("express");
const { Op } = require("sequelize");
const { ExceptionPattern } = require("../models");
const authenticateToken = require("../middleware/authenticateToken");
const isAdmin = require("../middleware/isAdmin");
const router = express.Router();

// GET all patterns for the user
router.get("/", async (req, res) => {
  const userId = req.user.id;

  try {
    const patterns = await ExceptionPattern.findAll({
      where: {
        [Op.or]: [{ userId }, { isGlobal: true }],
      },
      order: [["name", "ASC"]],
    });
    res.status(200).json(patterns);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching exception patterns",
      error: error.message,
    });
  }
});

// POST a new pattern
router.post("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { name, patternData } = req.body;
  if (!name || !patternData) {
    return res
      .status(400)
      .json({ message: "Name and pattern data are required." });
  }

  const canSetGlobal = req.user.isAdmin === true;
  // TODO: Add validation for patternData structure
  try {
    const newPattern = await ExceptionPattern.create({
      name,
      patternData,
      userId,
      isGlobal: canSetGlobal,
    });
    res.status(201).json(newPattern);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: `Pattern named "${name}" already exists.` });
    }
    res.status(500).json({
      message: "Error creating exception pattern",
      error: error.message,
    });
  }
});

// PUT (Update) an existing pattern
router.put("/:id", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const patternId = req.params.id;
  const { name, patternData } = req.body;
  if (!name || !patternData) {
    return re
      .status(400)
      .json({ message: "Name and pattern data are required." });
  }
  // TODO: Add validation for patternData structure
  try {
    const pattern = await ExceptionPattern.findOne({
      where: { id: patternId, userId },
    });
    if (!pattern) {
      return res
        .status(404)
        .json({ message: "Pattern not found or permission denied." });
    }
    pattern.name = name;
    pattern.patternData = patternData;
    await pattern.save();
    res.status(200).json(pattern);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: `Pattern named "${name}" already exists.` });
    }
    res.status(500).json({
      message: "Error updating exception pattern",
      error: error.message,
    });
  }
});

// DELETE a pattern
router.delete("/:id", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const patternId = req.params.id;
  try {
    const result = await ExceptionPattern.destroy({
      where: { id: patternId, userId },
    });
    if (result === 0) {
      return res
        .status(404)
        .json({ message: "Pattern not found or permission denied." });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      message: "Error deleting exception pattern",
      error: error.message,
    });
  }
});

module.exports = router;
