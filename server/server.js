// server/server.js
require("dotenv").config(); // Load .env variables first
const express = require("express");
const cors = require("cors");
const db = require("./models"); // Imports ./models/index.js by default

// --- Route Imports ---
const authRoutes = require("./routes/authRoutes");
const classRoutes = require("./routes/classRoutes");
const textbookRoutes = require("./routes/textbookRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const daysOffRoutes = require("./routes/daysOffRoutes");
const exceptionPatternsRoutes = require("./routes/exceptionPatternsRoutes");
const appliedExceptionsRoutes = require("./routes/appliedExceptionsRoutes");
const globalSettingsRoutes = require("./routes/globalSettingsRoutes");
const globalDaysOffRoutes = require("./routes/globalDaysOffRoutes");
const globalAppliedExceptionsRoutes = require("./routes/globalAppliedExceptionsRoutes");
const userRoutes = require("./routes/userRoutes.js");

// --- Middleware Imports ---
const authenticateToken = require("./middleware/authenticateToken");

// --- Global Error Handlers ---
process.on("uncaughtException", (error) => {
  console.error("!!! UNCAUGHT EXCEPTION !!!");
  console.error(error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("!!! UNHANDLED REJECTION !!!");
  console.error("Reason:", reason);
  console.error("Promise:", promise);
});
// --- End Global Error Handlers ---

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Core Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.get("/api", (req, res) => {
  res.json({ message: "Welcome to the Teacher Scheduler API!" });
});

// Mount public routes (like login/register)
app.use("/api/auth", authRoutes);

// Mount protected routes that require a valid token
app.use("/api/classes", authenticateToken, classRoutes);
app.use("/api/textbooks", authenticateToken, textbookRoutes);
app.use("/api/schedule", authenticateToken, scheduleRoutes);
app.use("/api/days-off", authenticateToken, daysOffRoutes);
app.use("/api/exception-patterns", authenticateToken, exceptionPatternsRoutes);
app.use("/api/applied-exceptions", authenticateToken, appliedExceptionsRoutes);

// Global routes (these have their own internal auth/admin checks)
app.use("/api/global-days-off", globalDaysOffRoutes);
app.use("/api/global-applied-exceptions", globalAppliedExceptionsRoutes);
app.use("/api/global-settings", globalSettingsRoutes);
app.use("/api/users", authenticateToken, userRoutes);

// --- Error Handling Middleware (Should be last) ---
app.use((err, req, res, next) => {
  console.error("--- Express Error Handler ---");
  console.error(err.stack || err.message || err);
  res.status(err.status || 500).send({
    message: err.message || "An unexpected server error occurred.",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Database Connection & Server Start
const PORT = process.env.PORT || 3000;
let serverInstance;

db.sequelize
  .sync()
  .then(() => {
    console.log("Database synced.");
    serverInstance = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
      if (typeof corsOptions !== "undefined" && corsOptions.origin) {
        console.log(`Allowing requests from: ${corsOptions.origin}`);
      }
    });
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
    process.exit(1);
  });

// Graceful shutdown function
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  if (serverInstance) {
    serverInstance.close(() => {
      console.log("HTTP server closed.");
      if (db && db.sequelize) {
        db.sequelize
          .close()
          .then(() => {
            console.log("Database connection closed.");
            process.exit(0);
          })
          .catch((err) => {
            console.error("Error closing database connection:", err);
            process.exit(1);
          });
      } else {
        process.exit(0);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

module.exports = app;
