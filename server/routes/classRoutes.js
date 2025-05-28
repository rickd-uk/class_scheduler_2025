const express = require("express");
const { Class, User, Textbook } = require("../models");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

// --- GET All Classes for the logged-in user ---
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const classes = await Class.findAll({
      where: { userId: userId },
      // Include color in the attributes to be returned
      attributes: [
        "id",
        "classNumber",
        "yearLevel",
        "classType",
        "className",
        "color",
        "createdAt",
        "updatedAt",
        "userId",
      ],
      include: [
        {
          model: Textbook,
          as: "textbooks",
          attributes: ["id", "title"],
          through: { attributes: [] },
        },
      ],
      order: [
        ["classType", "ASC"],
        ["yearLevel", "ASC"],
        ["classNumber", "ASC"],
        ["className", "ASC"],
      ],
    });
    res.status(200).json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({
      message: "Server error fetching classes.",
      error: error.message,
    });
  }
});

// --- POST (Add) a new Class for the logged-in user ---
router.post("/", async (req, res) => {
  // Destructure color from req.body
  const { classType, classNumber, yearLevel, className, color } = req.body;
  const userId = req.user.id;
  // Include color in dataToCreate, provide default
  let dataToCreate = { userId, classType, color: color || "#FFFFFF" };
  let validationError = null;
  let yearLvl = null;

  // --- Input Validation ---
  if (!classType || (classType !== "numbered" && classType !== "special")) {
    validationError = "Invalid class type specified.";
  } else {
    if (yearLevel) {
      yearLvl = parseInt(yearLevel, 10);
      if (isNaN(yearLvl) || yearLvl < 1 || yearLvl > 6) {
        validationError = "Year Level must be between 1 and 6.";
      } else {
        dataToCreate.yearLevel = yearLvl.toString();
      }
    }

    if (!validationError) {
      if (classType === "numbered") {
        if (!classNumber || !yearLevel) {
          validationError =
            "Class Number and Year Level are required for numbered classes.";
        } else {
          const classNum = parseInt(classNumber, 10);
          if (isNaN(classNum) || classNum < 1 || classNum > 15) {
            validationError = "Class Number must be between 1 and 15.";
          } else {
            dataToCreate.classNumber = classNum.toString();
            dataToCreate.className = null;
          }
        }
      } else if (classType === "special") {
        if (!className || className.trim() === "") {
          validationError = "Class Name is required for special classes.";
        } else {
          dataToCreate.className = className.trim();
          dataToCreate.classNumber = null;
        }
      }
    }
    // Optional: Validate color format (#RRGGBB)
    if (!validationError && color && !/^#[0-9A-F]{6}$/i.test(color)) {
      validationError = "Invalid color format. Use hex #RRGGBB.";
    }
  }

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }
  // --- End Validation & Assignment ---

  try {
    // Check for duplicates (Simplified - keep your full check if implemented)
    let existingClass = null;
    if (dataToCreate.classType === "numbered") {
      existingClass = await Class.findOne({
        where: {
          userId,
          classType: "numbered",
          yearLevel: dataToCreate.yearLevel,
          classNumber: dataToCreate.classNumber,
        },
      });
      if (existingClass)
        return res.status(409).json({
          message: `Numbered class ${dataToCreate.yearLevel}-${dataToCreate.classNumber} already exists.`,
        });
    } else {
      // Special class
      const whereClause = {
        userId,
        classType: "special",
        className: dataToCreate.className,
      };
      // if (dataToCreate.yearLevel) { whereClause.yearLevel = dataToCreate.yearLevel; } // Optional: Check uniqueness per year
      existingClass = await Class.findOne({ where: whereClause });
      if (existingClass)
        return res.status(409).json({
          message: `Special class named "${dataToCreate.className}" already exists${dataToCreate.yearLevel ? ` for Year ${dataToCreate.yearLevel}` : ""}.`,
        });
    }

    // Create the new class including color
    const newClass = await Class.create(dataToCreate);

    // Refetch with the association using the alias
    const classWithTextbooks = await Class.findByPk(newClass.id, {
      // Include color when refetching
      attributes: [
        "id",
        "classNumber",
        "yearLevel",
        "classType",
        "className",
        "color",
        "createdAt",
        "updatedAt",
        "userId",
      ],
      include: [
        {
          model: Textbook,
          as: "textbooks",
          attributes: ["id", "title"],
          through: { attributes: [] },
        },
      ],
    });
    res.status(201).json(classWithTextbooks || newClass);
  } catch (error) {
    console.error("Error adding class:", error);
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      const messages = error.errors?.map((err) => err.message) || [
        error.message,
      ];
      return res
        .status(400)
        .json({ message: "Validation failed", errors: messages });
    }
    res
      .status(500)
      .json({ message: "Server error adding class.", error: error.message });
  }
});

// --- PUT (Update) an existing Class ---
// Handles PUT requests to /api/classes/:id
router.put("/:id", async (req, res, next) => {
  const classId = req.params.id; // Get class ID from URL parameter
  const userId = req.user.id; // Get user ID from authenticated token
  // Get potential fields to update from request body
  const { classType, classNumber, yearLevel, className, color } = req.body;

  // --- Basic Validation ---
  let validationError = null;
  let dataToUpdate = {}; // Object to hold only the valid fields for update

  // IMPORTANT: We don't allow changing classType after creation in this implementation.
  // The classType from the body is primarily used here for validation logic.
  if (!classType || (classType !== "numbered" && classType !== "special")) {
    return res
      .status(400)
      .json({ message: "Invalid class type provided in update data." });
  }

  // Validate and prepare fields based on the class type
  if (classType === "numbered") {
    // Numbered classes require number and year level
    if (classNumber === undefined || yearLevel === undefined) {
      validationError =
        "Class Number and Year Level are required for numbered classes.";
    } else {
      const classNum = parseInt(classNumber, 10);
      const yearLvl = parseInt(yearLevel, 10);
      if (isNaN(classNum) || classNum < 1 || classNum > 15) {
        validationError = "Class Number must be between 1 and 15.";
      } else if (isNaN(yearLvl) || yearLvl < 1 || yearLvl > 6) {
        validationError = "Year Level must be between 1 and 6.";
      } else {
        // Add valid fields to the update object
        dataToUpdate.classNumber = classNum.toString();
        dataToUpdate.yearLevel = yearLvl.toString();
        dataToUpdate.className = null; // Ensure className is null for numbered type
      }
    }
  } else if (classType === "special") {
    // Special classes require a name
    if (
      className === undefined ||
      className === null ||
      className.trim() === ""
    ) {
      validationError = "Class Name is required for special classes.";
    } else {
      dataToUpdate.className = className.trim();
      dataToUpdate.classNumber = null; // Ensure number is null for special type
      // Allow updating optional year level for special classes
      if (yearLevel !== undefined) {
        // Check if yearLevel was provided in the update data
        const yearLvl = parseInt(yearLevel, 10);
        if (yearLevel === "" || yearLevel === null) {
          // Allow clearing year level
          dataToUpdate.yearLevel = null;
        } else if (isNaN(yearLvl) || yearLvl < 1 || yearLvl > 6) {
          validationError = "Year Level must be between 1 and 6.";
        } else {
          dataToUpdate.yearLevel = yearLvl.toString();
        }
      } // If yearLevel is not in req.body, it won't be included in dataToUpdate, preserving existing value
    }
  }

  // Validate color if provided in the request body
  if (!validationError && color !== undefined) {
    if (color === null || color === "" || /^#[0-9A-F]{6}$/i.test(color)) {
      // Allow setting color to null/empty (will use default) or valid hex
      dataToUpdate.color = color || "#FFFFFF";
    } else {
      validationError = "Invalid color format. Use hex #RRGGBB or leave empty.";
    }
  }
  // If color is not in req.body, dataToUpdate.color remains unset, preserving existing value

  // If any validation failed, return error
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }
  // --- End Validation ---

  try {
    console.log(
      `[PUT /api/classes/${classId}] Attempting update for user ${userId} with data:`,
      dataToUpdate,
    );
    // Find the class belonging to the user
    const classToUpdate = await Class.findOne({
      where: { id: classId, userId: userId },
    });

    // Handle class not found or permission denied
    if (!classToUpdate) {
      return res
        .status(404)
        .json({ message: "Class not found or permission denied." });
    }

    // Double-check: Prevent changing the fundamental type (numbered vs special) via update
    if (classToUpdate.classType !== classType) {
      return res.status(400).json({
        message:
          "Changing class type (numbered/special) after creation is not allowed.",
      });
    }

    // Optional: Add duplicate check logic here if needed (similar to POST route, excluding current classId)
    // ...

    // Update the found class instance with the validated data
    await classToUpdate.update(dataToUpdate);

    console.log(`[PUT /api/classes/${classId}] Update successful.`);
    // Refetch the updated class to include associations (like textbooks) for the response
    const updatedClassWithTextbooks = await Class.findByPk(classId, {
      attributes: [
        "id",
        "classNumber",
        "yearLevel",
        "classType",
        "className",
        "color",
        "createdAt",
        "updatedAt",
        "userId",
      ],
      include: [
        {
          model: Textbook,
          as: "textbooks",
          attributes: ["id", "title"],
          through: { attributes: [] },
        },
      ],
    });
    // Send back the updated class data
    res.status(200).json(updatedClassWithTextbooks);
  } catch (error) {
    // Handle potential errors during find or update
    console.error(
      `Error updating class ID ${classId} for user ${userId}:`,
      error,
    );
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      const messages = error.errors?.map((err) => err.message) || [
        error.message,
      ];
      return res.status(400).json({
        message: "Validation failed or duplicate detected",
        errors: messages,
      });
    }
    // Pass other errors to the central error handler
    next(error); // Use next(error) for unhandled server errors
  }
});

// --- DELETE a Class for the logged-in user ---
router.delete("/:id", async (req, res) => {
  const classId = req.params.id;
  const userId = req.user.id;
  try {
    const classToDelete = await Class.findOne({
      where: { id: classId, userId: userId },
    });
    if (!classToDelete) {
      return res.status(404).json({
        message: "Class not found or you do not have permission to delete it.",
      });
    }
    await classToDelete.destroy(); // CASCADE delete should handle ClassTextbooks entries
    res.status(204).send();
  } catch (error) {
    console.error(
      `[DELETE /api/classes] Error deleting class ID: ${classId}`,
      error,
    );
    res
      .status(500)
      .json({ message: "Server error deleting class.", error: error.message });
  }
});

// --- Link/Unlink Routes ---
router.post("/:classId/textbooks/:textbookId", async (req, res) => {
  const { classId, textbookId } = req.params;
  const userId = req.user.id;
  try {
    const targetClass = await Class.findOne({
      where: { id: classId, userId: userId },
    });
    if (!targetClass)
      return res
        .status(404)
        .json({ message: "Class not found or permission denied." });
    // Removed check preventing linking to special classes
    const targetTextbook = await Textbook.findByPk(textbookId);
    if (!targetTextbook)
      return res.status(404).json({ message: "Textbook not found." });

    await targetClass.addTextbook(targetTextbook);

    console.log(`Linked textbook ${textbookId} to class ${classId}`);
    const updatedClassWithTextbooks = await Class.findByPk(classId, {
      include: [
        {
          model: Textbook,
          as: "textbooks", // Use the alias
          attributes: ["id", "title"],
          through: { attributes: [] },
        },
      ],
    });
    res.status(200).json(updatedClassWithTextbooks);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: "This textbook is already linked to this class." });
    }
    console.error(
      `Error linking textbook ${textbookId} to class ${classId}:`,
      error,
    );
    res.status(500).json({
      message: "Server error linking textbook.",
      error: error.message,
    });
  }
});

router.delete("/:classId/textbooks/:textbookId", async (req, res) => {
  const { classId, textbookId } = req.params;
  const userId = req.user.id;
  try {
    const targetClass = await Class.findOne({
      where: { id: classId, userId: userId },
    });
    if (!targetClass)
      return res
        .status(404)
        .json({ message: "Class not found or permission denied." });
    const targetTextbook = await Textbook.findByPk(textbookId);
    if (!targetTextbook)
      return res.status(404).json({ message: "Textbook not found." });

    const result = await targetClass.removeTextbook(targetTextbook);

    if (result === 0)
      console.log(
        `Link between textbook ${textbookId} and class ${classId} did not exist.`,
      );
    else console.log(`Unlinked textbook ${textbookId} from class ${classId}`);
    res.status(204).send();
  } catch (error) {
    console.error(
      `Error unlinking textbook ${textbookId} from class ${classId}:`,
      error,
    );
    res.status(500).json({
      message: "Server error unlinking textbook.",
      error: error.message,
    });
  }
});

// --- TODO: Add PUT /:id route for editing classes (including color) ---

module.exports = router;
