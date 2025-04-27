require('dotenv').config(); // Load .env variables first
const express = require('express');
const cors = require('cors');
const db = require('./models'); // Imports ./models/index.js by default

const authRoutes = require('./routes/authRoutes'); // We will create this
const classRoutes = require('./routes/classRoutes'); // We will create this
const authenticateToken = require('./middleware/authenticateToken'); // We will create this

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Allow frontend origin
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Teacher Scheduler API!' });
});

app.use('/api/auth', authRoutes); // Mount authentication routes
app.use('/api/classes', authenticateToken, classRoutes); // Mount class routes (protected)

// Basic Error Handling (Add more robust handling later)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something broke!', error: err.message });
});

// Database Connection & Server Start
const PORT = process.env.PORT || 3000;

// Sync database (use { force: true } only in dev to drop/recreate tables)
// db.sequelize.sync({ force: true }).then(() => { // DANGEROUS IN PRODUCTION
db.sequelize.sync().then(() => { // Safer option
  console.log('Database synced.');
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
    console.log(`Allowing requests from: ${corsOptions.origin}`);
  });
}).catch((err) => {
  console.error('Failed to sync database:', err);
});


