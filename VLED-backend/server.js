/*const express = require('express');
const cors = require('cors');
require('dotenv').config();

const faqRoutes = require('./routes/faqRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/faqs', faqRoutes);

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} with Turso DB!`);
});*/
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Routes Import karein
const faqRoutes = require('./routes/faqRoutes');
const authRoutes = require('./routes/authRoutes'); // Nayi Auth routes

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/faqs', faqRoutes); // FAQ system (Turso DB)
app.use('/api/auth', authRoutes); // Login/Signup system (Turso DB)

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} with Turso DB!`);
    console.log(`✅ FAQ Routes active on /api/faqs`);
    console.log(`✅ Auth Routes active on /api/auth`);
});