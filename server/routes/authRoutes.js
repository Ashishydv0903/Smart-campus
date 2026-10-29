const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Institution = require('../models/Institution');
const { JWT_SECRET, authMiddleware } = require('../middleware/authMiddleware');

function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role, 
      email: user.email,
      institutionDomain: user.institutionDomain || 'campus.edu'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function extractDomain(email) {
  if (!email || !email.includes('@')) return '';
  return email.split('@')[1].toLowerCase().trim();
}

// Helper to verify if domain is whitelisted
async function isDomainAllowed(domain) {
  if (!domain) return false;
  // Check if institution exists and isActive
  const inst = await Institution.findOne({ domain: domain.toLowerCase(), isActive: true });
  return !!inst;
}

// 1. Get List of Allowed College Domains (Public)
router.get('/institutions', async (req, res) => {
  try {
    const institutions = await Institution.find({}).sort({ name: 1 });
    res.json({ success: true, institutions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Add New Allowed College Domain (Platform Administrator)
router.post('/institutions', async (req, res) => {
  try {
    const { name, domain, code } = req.body;
    if (!name || !domain) {
      return res.status(400).json({ success: false, message: 'Institution name and domain are required.' });
    }

    const cleanDomain = domain.toLowerCase().trim().replace(/^@/, '');
    const existing = await Institution.findOne({ domain: cleanDomain });
    if (existing) {
      return res.status(400).json({ success: false, message: `Domain '@${cleanDomain}' is already registered.` });
    }

    const inst = await Institution.create({
      name,
      domain: cleanDomain,
      code: code || cleanDomain.split('.')[0].toUpperCase(),
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: `College domain '@${cleanDomain}' has been whitelisted for platform access.`,
      institution: inst
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Toggle College Domain Status (Active / Inactive)
router.put('/institutions/:id/toggle', async (req, res) => {
  try {
    const inst = await Institution.findById(req.params.id);
    if (!inst) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    inst.isActive = !inst.isActive;
    await inst.save();

    res.json({
      success: true,
      message: `Access for '@${inst.domain}' is now ${inst.isActive ? 'ACTIVE' : 'SUSPENDED'}.`,
      institution: inst
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3b. Delete/Remove College Domain Completely (Platform Admin / Director)
router.delete('/institutions/:id', async (req, res) => {
  try {
    const inst = await Institution.findById(req.params.id);
    if (!inst) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    const removedDomain = inst.domain;
    await Institution.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Domain '@${removedDomain}' has been removed from authorized institutions. Users with this domain can no longer access the platform.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Register Account (Strict Domain Validation)
router.post('/register', async (req, res) => {
  try {
    const { name, email, prn = '', password, role = 'student', department = 'General', campusZone = 'Hostel Block A' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, institutional email, and password are required.' });
    }

    const domain = extractDomain(email);
    const allowed = await isDomainAllowed(domain);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `Access Restricted: '@${domain}' is not an authorized college domain. Please use your official college email or ask your administration to whitelist your university.`
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this institutional email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      prn,
      password: hashedPassword,
      role,
      institutionDomain: domain,
      department,
      campusZone
    });

    // Increment institution student counter
    await Institution.updateOne({ domain }, { $inc: { registeredStudentsCount: 1 } });

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: `Welcome to CampusFix for @${domain}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionDomain: user.institutionDomain,
        department: user.department,
        campusZone: user.campusZone
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Secure Sign In (Email or PRN)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'PRN/Email and password required.' });
    }

    const cleanInput = email.trim();
    const searchRegex = new RegExp(`^${cleanInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    // Query strictly by institutional email OR PRN/Admin ID
    const user = await User.findOne({
      $or: [
        { email: searchRegex },
        { prn: searchRegex }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    // Platform Administrator is exempt from institutional domain restrictions;
    // college users must match an active whitelisted domain
    if (user.role !== 'admin') {
      const domain = user.institutionDomain || extractDomain(user.email);
      const allowed = await isDomainAllowed(domain);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: `Access for college domain '@${domain}' has been suspended or is not approved.`
        });
      }
    }

    // Secure bcrypt hash verification against stored credentials
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionDomain: user.institutionDomain,
        department: user.department,
        campusZone: user.campusZone
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Working Google Login Endpoint
router.post('/google-login', async (req, res) => {
  try {
    const { email, name = 'Google User', defaultRole = 'student' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Google email address is required.' });
    }

    const domain = extractDomain(email);
    const allowed = await isDomainAllowed(domain);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `Google Account Rejected: '@${domain}' is not an authorized college domain. You must sign in with your official university Google account.`
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Auto-provision user with approved domain
      const randomPass = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPass, 10);
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: defaultRole,
        institutionDomain: domain,
        department: 'General'
      });
      await Institution.updateOne({ domain }, { $inc: { registeredStudentsCount: 1 } });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: `Signed in with Google as ${user.email}`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionDomain: user.institutionDomain,
        department: user.department,
        campusZone: user.campusZone
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Working Forgot Password Request
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please enter your registered college email.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with this email.' });
    }

    // Generate 6-digit verification reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken = resetCode;
    user.resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
    await user.save();

    res.json({
      success: true,
      message: `Password reset verification code sent to ${user.email}! (Code: ${resetCode})`,
      resetCode: resetCode // returned for instant UI testing
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Working Reset Password Submission
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;
    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, reset code, and new password are required.' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetToken: resetCode.trim(),
      resetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Current User Profile
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// 10. Get Students in Institution (HOD / Director / Admin Control)
router.get('/students', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['hod', 'director', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to Head of Department (HOD) and Campus Directors.'
      });
    }

    const institutionDomain = req.user.institutionDomain || 'campus.edu';
    const { search, department } = req.query;

    const query = {
      institutionDomain,
      role: 'student'
    };

    if (department && department !== 'All') {
      query.department = department;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { prn: searchRegex }
      ];
    }

    const students = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    // Flag any students whose email domain does NOT match the institution domain
    const studentsWithFlags = students.map(s => {
      const emailDomain = extractDomain(s.email);
      const isMismatched = emailDomain !== institutionDomain;
      return {
        ...s.toObject(),
        isMismatchedDomain: isMismatched,
        actualEmailDomain: emailDomain
      };
    });

    res.json({
      success: true,
      count: studentsWithFlags.length,
      institutionDomain,
      students: studentsWithFlags
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 11. HOD / Director Remove Student (e.g. from different college or fraudulent)
router.delete('/students/:id', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['hod', 'director', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only Head of Department (HOD) or Director has authority to remove students.'
      });
    }

    const institutionDomain = req.user.institutionDomain || 'campus.edu';
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    // Verify HOD/Director belongs to same institution (or student has invalid domain)
    if (student.institutionDomain !== institutionDomain && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only manage students registered in your institution.'
      });
    }

    const studentName = student.name;
    const studentEmail = student.email;
    const studentDomain = student.institutionDomain;

    await User.findByIdAndDelete(req.params.id);

    // Decrement student count on institution
    await Institution.updateOne({ domain: studentDomain }, { $inc: { registeredStudentsCount: -1 } });

    res.json({
      success: true,
      message: `Student ${studentName} (${studentEmail}) has been successfully removed from this college portal.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
