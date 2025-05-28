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
// --- Middleware Imports ---
// authenticateToken and isAdmin are used within specific routes, not globally here for all /api/*
// const authenticateToken = require("./middleware/authenticateToken");
// const isAdmin = require("./middleware/isAdmin");

// --- Global Error Handlers ---
process.on("uncaughtException", (error) => {
  console.error("!!! UNCAUGHT EXCEPTION !!!");
  console.error(error);
  // Optionally exit gracefully - uncomment if needed, but might hide errors from nodemon restart
  // process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("!!! UNHANDLED REJECTION !!!");
  console.error("Reason:", reason);
  console.error("Promise:", promise);
  // Optionally exit gracefully
  // process.exit(1);
});
// --- End Global Error Handlers ---

const app = express();

// CORS Configuration
const corsOptions = {
  // Use the value from .env or the compose file, fallback to default
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

// Core Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- API Routes ---
app.get("/api", (req, res) => {
  res.json({ message: "Welcome to the Teacher Scheduler API!" });
});

// Mount routes
app.use("/api/auth", authRoutes);
// For routes requiring authentication or admin rights,
// the middleware (authenticateToken, isAdmin) should be applied
// within the respective route files (e.g., classRoutes.js, or specific routes in globalSettingsRoutes.js)
// or here if ALL routes under a path need it.
// Example: app.use("/api/classes", authenticateToken, classRoutes);
app.use("/api/classes", classRoutes); // Assuming classRoutes applies its own middleware internally if needed
app.use("/api/textbooks", textbookRoutes);
app.use("/api/schedule", scheduleRoutes); // Assuming scheduleRoutes applies its own middleware
app.use("/api/days-off", daysOffRoutes);
app.use("/api/exception-patterns", exceptionPatternsRoutes);
app.use("/api/applied-exceptions", appliedExceptionsRoutes);

// Global routes
app.use("/api/global-days-off", globalDaysOffRoutes); // Assuming these apply their own auth/admin middleware
app.use("/api/global-applied-exceptions", globalAppliedExceptionsRoutes);
app.use("/api/global-settings", globalSettingsRoutes); // globalSettingsRoutes will handle its own middleware for specific sub-routes

// --- Error Handling Middleware (Should be last) ---
app.use((err, req, res, next) => {
  console.error("--- Express Error Handler ---");
  console.error(err.stack || err.message || err); // Log stack for better debugging
  // Send a generic error message or specific one based on error type
  res.status(err.status || 500).send({
    message: err.message || "An unexpected server error occurred.",
    // Optionally include error details in development only
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Assuming 'app' is your Express app instance and 'db' is your Sequelize instance from './models'
// Also assuming 'corsOptions' is defined earlier in your server.js file

// Database Connection & Server Start
const PORT = process.env.PORT || 3000;
let serverInstance; // Variable to hold the server instance

db.sequelize
  .sync() // Consider { alter: true } or { force: true } only for development
  .then(() => {
    console.log("Database synced.");
    serverInstance = app.listen(PORT, () => {
      // Assign app.listen to serverInstance
      console.log(`Server is running on port ${PORT}.`);
      // Log the actual origin being allowed by CORS (assuming corsOptions is in scope)
      if (typeof corsOptions !== "undefined" && corsOptions.origin) {
        console.log(`Allowing requests from: ${corsOptions.origin}`);
      } else {
        // This else block is just for robustness if corsOptions isn't in the immediate scope
        // of the original snippet, but it should be based on your full server.js.
        // console.log('CORS origin not explicitly logged in this snippet.');
      }
    });
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
    process.exit(1); // Exit if DB connection fails
  });

// Graceful shutdown function
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  if (serverInstance) {
    serverInstance.close(() => {
      console.log("HTTP server closed.");
      // Close a_posteriori_database connection
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
        console.log("Sequelize instance not found, exiting.");
        process.exit(0);
      }
    });
  } else {
    // If serverInstance is not defined, it means the server hasn't started listening yet.
    // This could happen if db.sync() failed or is still in progress.
    console.log(
      "HTTP server not started. Attempting to close database connection if available.",
    );
    if (db && db.sequelize) {
      db.sequelize
        .close()
        .then(() => {
          console.log(
            "Database connection closed (server was not fully started).",
          );
          process.exit(0);
        })
        .catch((err) => {
          console.error(
            "Error closing database connection (server was not fully started):",
            err,
          );
          process.exit(1);
        });
    } else {
      console.log("Sequelize instance not found, exiting directly.");
      process.exit(0);
    }
  }

  // If server doesn't close in time, force exit
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 10000); // 10 seconds timeout
};

// Listen for common termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // Sent by `kill` or process managers
process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Sent by `Ctrl+C`

module.exports = app; // Your existing export
