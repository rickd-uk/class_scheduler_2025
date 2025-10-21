// server/routes/daysOffRoutes.js

const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const { DayOff, GlobalDayOff } = require("../models");
const router = express.Router();

// All routes here require a valid token
router.use(authenticateToken);

// --- GET all personal days off for the logged-in user ---
router.get("/", async (req, res) => {
  const userId = req.user.id;
  try {
    console.log(`[GET /api/days-off] Fetching days off for user ${userId}`);
    const days = await DayOff.findAll({
      where: { userId },
      attributes: [
        "id",
        "date",
        "reason",
        "color",
        "createdAt",
        "updatedAt",
        "userId",
      ],
      order: [["date", "ASC"]],
    });
    res.status(200).json(days);
  } catch (err) {
    console.error(`Error fetching days off for user ${userId}:`, err);
    res
      .status(500)
      .json({ message: "Error fetching days off", error: err.message });
  }
});

// --- POST a new personal day off ---
router.post("/", async (req, res) => {
  const userId = req.user.id;
  const { date, reason, color } = req.body;

  // Validate date
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res
      .status(400)
      .json({ message: "Valid date (YYYY-MM-DD) is required." });
  }
  // Validate color
  if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
    return res
      .status(400)
      .json({ message: "Invalid color format. Use hex #RRGGBB." });
  }

  try {
    console.log(
      `[POST /api/days-off] Creating day off for user ${userId} on ${date}`,
    );
    const dayOff = await DayOff.create({
      userId,
      date,
      reason: reason || null,
      color: color || "#F0F0F0",
    });

    // If admin, mirror into GlobalDayOff
    if (req.user.isAdmin) {
      console.log(
        `[POST /api/days-off] (admin) also upserting global day off on ${date}`,
      );
      await GlobalDayOff.findOrCreate({
        where: { date },
        defaults: { date, reason: reason || null, color: color || "#F0F0F0" },
      });
    }

    res.status(201).json(dayOff);
  } catch (err) {
    console.error(`Error creating day off for user ${userId}:`, err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: `You already have a day off on ${date}.` });
    }
    res
      .status(500)
      .json({ message: "Error adding day off", error: err.message });
  }
});

// --- PUT (update) an existing personal day off by date ---
router.put("/:date", async (req, res) => {
  const userId = req.user.id;
  const dateParam = req.params.date;
  const { reason, color } = req.body;

  // Validate date param
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return res
      .status(400)
      .json({ message: "Valid date parameter (YYYY-MM-DD) is required." });
  }
  if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
    return res
      .status(400)
      .json({ message: "Invalid color format. Use hex #RRGGBB." });
  }

  try {
    console.log(
      `[PUT /api/days-off] Updating day off for user ${userId} on ${dateParam}`,
    );
    const dayOff = await DayOff.findOne({ where: { userId, date: dateParam } });
    if (!dayOff) {
      return res
        .status(404)
        .json({ message: "Day off not found for this user/date." });
    }

    dayOff.reason = reason !== undefined ? reason : dayOff.reason;
    dayOff.color = color !== undefined ? color : dayOff.color;
    await dayOff.save();

    // If admin, mirror update to GlobalDayOff
    if (req.user.isAdmin) {
      console.log(
        `[PUT /api/days-off] (admin) also updating global day off on ${dateParam}`,
      );
      const [global, created] = await GlobalDayOff.findOrCreate({
        where: { date: dateParam },
        defaults: {
          date: dateParam,
          reason: dayOff.reason,
          color: dayOff.color,
        },
      });
      if (!created) {
        global.reason = dayOff.reason;
        global.color = dayOff.color;
        await global.save();
      }
    }

    res.status(200).json(dayOff);
  } catch (err) {
    console.error(
      `Error updating day off for user ${userId} on ${dateParam}:`,
      err,
    );
    res
      .status(500)
      .json({ message: "Error updating day off", error: err.message });
  }
});

// --- DELETE a personal day off by date ---
router.delete("/:date", async (req, res) => {
  const userId = req.user.id;
  const dateParam = req.params.date;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return res
      .status(400)
      .json({ message: "Valid date parameter (YYYY-MM-DD) is required." });
  }

  try {
    console.log(
      `[DELETE /api/days-off] Deleting day off for user ${userId} on ${dateParam}`,
    );
    const deleted = await DayOff.destroy({
      where: { userId, date: dateParam },
    });
    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Day off not found for this user/date." });
    }

    // If admin, also delete from GlobalDayOff
    if (req.user.isAdmin) {
      console.log(
        `[DELETE /api/days-off] (admin) also deleting global day off on ${dateParam}`,
      );
      await GlobalDayOff.destroy({ where: { date: dateParam } });
    }

    res.status(204).send();
  } catch (err) {
    console.error(
      `Error deleting day off for user ${userId} on ${dateParam}:`,
      err,
    );
    res
      .status(500)
      .json({ message: "Error deleting day off", error: err.message });
  }
});

module.exports = router;
