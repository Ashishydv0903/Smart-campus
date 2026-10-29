const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  prn: {
    type: String,
    trim: true,
    default: ''
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'hod', 'director', 'technician', 'admin'],
    default: 'student'
  },
  institutionDomain: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    default: 'campus.edu'
  },
  department: {
    type: String,
    default: 'General'
  },
  campusZone: {
    type: String,
    default: 'Hostel Block A'
  },
  phone: {
    type: String,
    default: '+91-9876543210'
  },
  resetToken: {
    type: String,
    default: null
  },
  resetExpires: {
    type: Date,
    default: null
  }
}, { timestamps: true });

userSchema.index({ institutionDomain: 1, email: 1 });

module.exports = mongoose.model('User', userSchema);
