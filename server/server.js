require('dotenv').config(); // Load .env variables first
const express = require('express');
const cors = require('cors');
const db = require('./models'); // Imports ./models/index.js by default

// --- Route Imports ---
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const textbookRoutes = require('./routes/textbookRoutes'); // Import textbook routes
// --- Middleware Imports ---
const authenticateToken = require('./middleware/authenticateToken');

// --- Global Error Handlers ---
process.on('uncaughtException', (error) => {
  console.error('!!! UNCAUGHT EXCEPTION !!!');
  console.error(error);
  // process.exit(1); // Consider exiting on uncaught exceptions
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('!!! UNHANDLED REJECTION !!!');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  // process.exit(1); // Consider exiting on unhandled rejections
});
// --- End Global Error Handlers ---


const app = express();

// CORS Configuration
const corsOptions = {
  // Use the value from .env or the compose file, fallback to default
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Core Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- API Routes ---
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Teacher Scheduler API!' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', authenticateToken, classRoutes); // Classes routes are protected
app.use('/api/textbooks', textbookRoutes); // Mount textbook routes (add authenticateToken if needed)

// --- Error Handling Middleware (Should be last) ---
app.use((err, req, res, next) => {
  console.error("--- Express Error Handler ---");
  console.error(err.stack);
  // Send a generic error message or specific one based on error type
  res.status(err.status || 500).send({
      message: err.message || 'An unexpected server error occurred.',
      // Optionally include error details in development only
      error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Database Connection & Server Start
const PORT = process.env.PORT || 3000;

db.sequelize.sync().then(() => {
  console.log('Database synced.');
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
    // Log the actual origin being allowed by CORS
    console.log(`Allowing requests from: ${corsOptions.origin}`);
  });
}).catch((err) => {
  console.error('Failed to sync database:', err);
  process.exit(1); // Exit if DB connection fails
});


