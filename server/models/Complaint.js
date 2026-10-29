const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  institutionDomain: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    default: 'campus.edu'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    required: true,
    enum: ['Electrical', 'Plumbing', 'Civil', 'Sanitation', 'IT_Network', 'General']
  },
  location: {
    zone: {
      type: String,
      required: true
    },
    floor: {
      type: String,
      default: 'Ground Floor'
    },
    roomOrArea: {
      type: String,
      required: true
    },
    coordinates: {
      lat: { type: Number, default: 28.545 },
      lng: { type: Number, default: 77.192 }
    }
  },
  reportedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: 'student' }
  },
  status: {
    type: String,
    enum: ['Reported', 'In_Review', 'Assigned', 'In_Progress', 'Pending_Verification', 'Resolved', 'Escalated'],
    default: 'Reported'
  },
  priority: {
    type: String,
    enum: ['P1', 'P2', 'P3', 'P4'],
    default: 'P3'
  },
  aiAnalysis: {
    summary: { type: String },
    isHazard: { type: Boolean, default: false },
    damageSeverity: { type: Number, min: 1, max: 10, default: 5 }
  },
  cluster: {
    isParent: { type: Boolean, default: true },
    parentTicketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
    affectedCount: { type: Number, default: 1 },
    subscribers: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      email: String,
      joinedAt: { type: Date, default: Date.now }
    }]
  },
  media: {
    evidencePhotoUrl: { type: String, default: '' },
    resolutionProofUrl: { type: String, default: '' },
    resolutionNotes: { type: String, default: '' }
  },
  assignedTo: {
    technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    technicianName: { type: String, default: 'Unassigned' },
    department: { type: String, default: 'General' },
    assignedAt: { type: Date }
  },
  sla: {
    targetHours: { type: Number, default: 24 },
    deadline: { type: Date },
    isBreached: { type: Boolean, default: false },
    escalationLevel: { type: Number, enum: [0, 1, 2, 3], default: 0 },
    escalatedAt: { type: Date, default: null },
    escalatedToRole: { type: String, default: 'None' },
    breachDurationMinutes: { type: Number, default: 0 }
  },
  verification: {
    verifiedByStudent: { type: Boolean, default: false },
    studentRating: { type: Number, min: 1, max: 5, default: null },
    studentFeedback: { type: String, default: '' },
    verifiedAt: { type: Date, default: null }
  }
}, { timestamps: true });

complaintSchema.index({ institutionDomain: 1, 'location.zone': 1, status: 1 });
complaintSchema.index({ institutionDomain: 1, status: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
