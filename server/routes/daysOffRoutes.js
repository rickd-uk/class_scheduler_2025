const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { DayOff, GlobalDayOff } = require("../models");
const { Op } = require("sequelize");

// Apply authentication middleware to all routes
router.use(authenticateToken);

// --- Helper function to expand date ranges ---
function expandDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// --- Helper function to check if a date is within any existing range ---
async function isDateInExistingRange(userId, dateStr, excludeId = null) {
  const whereClause = {
    userId,
    isRange: true, // Only check ranges
    startDate: { [Op.lte]: dateStr },
    endDate: { [Op.gte]: dateStr },
  };

  if (excludeId) {
    whereClause.id = { [Op.not]: excludeId };
  }

  const overlapping = await DayOff.findOne({ where: whereClause });
  return !!overlapping;
}

// --- Helper function to check for overlapping ranges ---
async function hasOverlappingRange(
  userId,
  startDate,
  endDate,
  excludeId = null,
) {
  const whereClause = {
    userId,
    [Op.or]: [
      // Existing range overlaps with new range
      {
        isRange: true,
        startDate: { [Op.lte]: endDate },
        endDate: { [Op.gte]: startDate },
      },
      // Single day falls within new range
      {
        isRange: false,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
    ],
  };

  if (excludeId) {
    whereClause.id = { [Op.not]: excludeId };
  }

  const overlapping = await DayOff.findOne({ where: whereClause });
  return !!overlapping;
}

// --- GET all personal days off ---
router.get("/", async (req, res) => {
  const userId = req.user.id;
  console.log(`[GET /api/days-off] Fetching days off for user ${userId}`);

  try {
    const daysOff = await DayOff.findAll({
      where: { userId },
      order: [["date", "ASC"]],
    });

    // Return the raw records - let the frontend decide how to handle them
    res.status(200).json(daysOff);
  } catch (err) {
    console.error(`Error fetching days off for user ${userId}:`, err);
    res
      .status(500)
      .json({ message: "Error fetching days off", error: err.message });
  }
});

// --- POST a new personal day off (single day or range) ---
router.post("/", async (req, res) => {
  const userId = req.user.id;
  const { date, startDate, endDate, reason, color } = req.body;

  console.log(`[POST /api/days-off] User ${userId} adding day off`, req.body);

  // Validation
  const isRange = !!(startDate && endDate);

  if (!isRange && !date) {
    return res
      .status(400)
      .json({ message: "date is required for single days" });
  }

  if (isRange && (!startDate || !endDate)) {
    return res
      .status(400)
      .json({ message: "Both startDate and endDate are required for ranges" });
  }

  if (isRange && startDate > endDate) {
    return res
      .status(400)
      .json({ message: "startDate must be on or before endDate" });
  }

  // Validate date formats
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (isRange) {
    if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }
  } else {
    if (!datePattern.test(date)) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }
  }

  if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
    return res
      .status(400)
      .json({ message: "Invalid color format. Use hex #RRGGBB." });
  }

  try {
    // Check for overlaps
    if (isRange) {
      const hasOverlap = await hasOverlappingRange(userId, startDate, endDate);
      if (hasOverlap) {
        return res.status(409).json({
          message: "Date range overlaps with existing day off",
        });
      }
    } else {
      // Check if single date already exists
      const existing = await DayOff.findOne({ where: { userId, date } });
      if (existing) {
        return res.status(409).json({
          message: "Day off already exists for this date",
        });
      }

      // Check if single date falls within an existing range
      const inRange = await isDateInExistingRange(userId, date);
      if (inRange) {
        return res.status(409).json({
          message: "Date falls within an existing date range",
        });
      }
    }

    // Create the day off record
    const dayOffData = {
      userId,
      date: isRange ? startDate : date,
      startDate: isRange ? startDate : null,
      endDate: isRange ? endDate : null,
      isRange: isRange,
      reason: reason || null,
      color: color || "#F0F0F0",
    };

    const newDayOff = await DayOff.create(dayOffData);

    // If admin, also add to GlobalDayOff
    if (req.user.isAdmin) {
      console.log(
        `[POST /api/days-off] (admin) also adding to global days off`,
      );
      if (isRange) {
        // For ranges, add the range record to global
        await GlobalDayOff.create({
          date: startDate,
          startDate,
          endDate,
          isRange: true,
          reason: newDayOff.reason,
          color: newDayOff.color,
        });
      } else {
        await GlobalDayOff.create({
          date: newDayOff.date,
          isRange: false,
          reason: newDayOff.reason,
          color: newDayOff.color,
        });
      }
    }

    res.status(201).json(newDayOff);
  } catch (err) {
    console.error(`Error adding day off for user ${userId}:`, err);
    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Validation error",
        error: err.errors.map((e) => e.message).join(", "),
      });
    }
    res
      .status(500)
      .json({ message: "Error adding day off", error: err.message });
  }
});

// --- PUT update a personal day off (by ID) ---
router.put("/:id", async (req, res) => {
  const userId = req.user.id;
  const dayOffId = req.params.id;
  const { reason, color, startDate, endDate } = req.body;

  console.log(
    `[PUT /api/days-off/${dayOffId}] Updating day off for user ${userId}`,
  );

  // Validate color if provided
  if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
    return res
      .status(400)
      .json({ message: "Invalid color format. Use hex #RRGGBB." });
  }

  try {
    const dayOff = await DayOff.findOne({ where: { id: dayOffId, userId } });
    if (!dayOff) {
      return res
        .status(404)
        .json({ message: "Day off not found for this user." });
    }

    // Check if we're updating the range
    const isUpdatingRange = startDate !== undefined || endDate !== undefined;

    if (isUpdatingRange) {
      const newStartDate = startDate || dayOff.startDate;
      const newEndDate = endDate || dayOff.endDate;

      // Validate dates
      if (newStartDate && newEndDate && newStartDate > newEndDate) {
        return res
          .status(400)
          .json({ message: "startDate must be on or before endDate" });
      }

      // Check for overlaps (excluding current record)
      if (newStartDate && newEndDate) {
        const hasOverlap = await hasOverlappingRange(
          userId,
          newStartDate,
          newEndDate,
          dayOffId,
        );
        if (hasOverlap) {
          return res.status(409).json({
            message: "Updated date range would overlap with existing day off",
          });
        }
      }

      dayOff.startDate = newStartDate;
      dayOff.endDate = newEndDate;
      dayOff.date = newStartDate; // Keep date in sync with startDate
      dayOff.isRange = !!(newStartDate && newEndDate);
    }

    // Update other fields
    if (reason !== undefined) dayOff.reason = reason;
    if (color !== undefined) dayOff.color = color;

    await dayOff.save();

    // If admin, mirror update to GlobalDayOff
    if (req.user.isAdmin) {
      console.log(
        `[PUT /api/days-off/${dayOffId}] (admin) also updating global day off`,
      );
      const globalDayOff = await GlobalDayOff.findOne({
        where: { date: dayOff.date },
      });
      if (globalDayOff) {
        if (reason !== undefined) globalDayOff.reason = reason;
        if (color !== undefined) globalDayOff.color = color;
        if (isUpdatingRange) {
          globalDayOff.startDate = dayOff.startDate;
          globalDayOff.endDate = dayOff.endDate;
          globalDayOff.isRange = dayOff.isRange;
        }
        await globalDayOff.save();
      }
    }

    res.status(200).json(dayOff);
  } catch (err) {
    console.error(`Error updating day off ${dayOffId}:`, err);
    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Validation error",
        error: err.errors.map((e) => e.message).join(", "),
      });
    }
    res
      .status(500)
      .json({ message: "Error updating day off", error: err.message });
  }
});

// --- DELETE a personal day off by ID ---
router.delete("/:id", async (req, res) => {
  const userId = req.user.id;
  const dayOffId = req.params.id;

  console.log(
    `[DELETE /api/days-off/${dayOffId}] Deleting day off for user ${userId}`,
  );

  try {
    const dayOff = await DayOff.findOne({ where: { id: dayOffId, userId } });
    if (!dayOff) {
      return res
        .status(404)
        .json({ message: "Day off not found for this user." });
    }

    const dateToDelete = dayOff.date;
    await dayOff.destroy();

    // If admin, also delete from GlobalDayOff
    if (req.user.isAdmin) {
      console.log(
        `[DELETE /api/days-off/${dayOffId}] (admin) also deleting global day off`,
      );
      await GlobalDayOff.destroy({ where: { date: dateToDelete } });
    }

    res.status(204).send();
  } catch (err) {
    console.error(`Error deleting day off ${dayOffId}:`, err);
    res
      .status(500)
      .json({ message: "Error deleting day off", error: err.message });
  }
});

// --- NEW: GET check if a specific date is a day off ---
router.get("/check/:date", async (req, res) => {
  const userId = req.user.id;
  const dateStr = req.params.date;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res
      .status(400)
      .json({ message: "Invalid date format. Use YYYY-MM-DD." });
  }

  try {
    // Check single day records
    const singleDay = await DayOff.findOne({
      where: { userId, date: dateStr, isRange: false },
    });

    if (singleDay) {
      return res.status(200).json({ isDayOff: true, dayOff: singleDay });
    }

    // Check if date falls within a range
    const rangeDay = await DayOff.findOne({
      where: {
        userId,
        isRange: true,
        startDate: { [Op.lte]: dateStr },
        endDate: { [Op.gte]: dateStr },
      },
    });

    if (rangeDay) {
      return res.status(200).json({ isDayOff: true, dayOff: rangeDay });
    }

    res.status(200).json({ isDayOff: false });
  } catch (err) {
    console.error(`Error checking if ${dateStr} is a day off:`, err);
    res
      .status(500)
      .json({ message: "Error checking day off", error: err.message });
  }
});

module.exports = router;
