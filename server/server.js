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
const authenticateToken = require("./middleware/authenticateToken");
const isAdmin = require("./middleware/isAdmin");

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
app.use("/api/classes", authenticateToken, classRoutes); // Classes routes are protected
app.use("/api/textbooks", textbookRoutes); // Add authenticateToken if textbooks become user-specific
app.use("/api/schedule", authenticateToken, scheduleRoutes); // Schedule routes are protected
// Mount days off routes under /api/days-off and apply authentication middleware
app.use("/api/days-off", authenticateToken, daysOffRoutes); // <-- Mount Days Off routes (protected)
app.use("/api/exception-patterns", authenticateToken, exceptionPatternsRoutes); // <-- Mount
app.use("/api/applied-exceptions", authenticateToken, appliedExceptionsRoutes); // <-- Mount
// Global routes (require login AND admin privileges)
app.use("/api/global-days-off", authenticateToken, globalDaysOffRoutes); // <-- Mount Global Days Off
app.use(
  "/api/global-applied-exceptions",
  authenticateToken,
  globalAppliedExceptionsRoutes,
); // <-- Mount Global Applied Exceptions
app.use("/api/global-settings", globalSettingsRoutes);

// --- Error Handling Middleware (Should be last) ---
app.use((err, req, res, next) => {
  console.error("--- Express Error Handler ---");
  console.error(err.stack);
  // Send a generic error message or specific one based on error type
  res.status(err.status || 500).send({
    message: err.message || "An unexpected server error occurred.",
    // Optionally include error details in development only
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Database Connection & Server Start
const PORT = process.env.PORT || 3000;

db.sequelize
  .sync()
  .then(() => {
    console.log("Database synced.");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
      // Log the actual origin being allowed by CORS
      console.log(`Allowing requests from: ${corsOptions.origin}`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
    process.exit(1); // Exit if DB connection fails
  });
