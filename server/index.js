const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { startSlaWatchdog } = require('./services/slaService');
const { syncAdminAccount } = require('./services/adminService');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_campus_db';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    service: 'Smart Campus AI Grievance & Maintenance Engine',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Connect DB & Start Server
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log(`[Database] MongoDB connected successfully to ${MONGO_URI}`);
    
    // Synchronize Administrator account configured securely in .env
    await syncAdminAccount();

    // Start background SLA Escalation Watchdog (scans every 60 seconds)
    startSlaWatchdog(60);

    app.listen(PORT, () => {
      console.log(`[Server] Smart Campus AI Backend running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[Database Error] Failed to connect to MongoDB:', err.message);
  });
