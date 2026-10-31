const dns = require('dns');

// Fix MongoDB Atlas DNS resolution issue (SRV record lookup)
dns.setServers([
  '8.8.8.8',
  '8.8.4.4'
]);

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
    if (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED')) {
      console.error('💡 DNS Tip: If DNS resolution fails for MongoDB Atlas, Google DNS (8.8.8.8) is active. Verify internet connectivity.');
    } else if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.error('💡 Auth Tip: MongoDB Atlas authentication failed. Please check the username and password in MONGO_URI.');
    } else if (err.message.includes('timed out') || err.message.includes('Server selection timed out')) {
      console.error('💡 Network Access Tip: Connection timed out. Make sure your IP is whitelisted in MongoDB Atlas -> Network Access (add 0.0.0.0/0 to allow all).');
    }
  });
