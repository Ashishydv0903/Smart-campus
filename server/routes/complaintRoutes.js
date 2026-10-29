const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { authMiddleware } = require('../middleware/authMiddleware');
const { analyzeComplaint } = require('../services/aiService');
const { findDuplicateIncident } = require('../services/clusteringService');
const { calculateSlaDeadline, checkAndEscalateTickets } = require('../services/slaService');

// Helper to generate sequential Ticket ID guaranteed never to collide
async function generateNextTicketId(domain = 'campus.edu') {
  const prefix = (domain.split('.')[0] || 'CAMPUS').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const year = new Date().getFullYear();
  let candidateNum = (await Complaint.countDocuments({ institutionDomain: domain })) + 1001;
  let candidateId = `${prefix}-${year}-${String(candidateNum).padStart(4, '0')}`;

  while (await Complaint.exists({ ticketId: candidateId })) {
    candidateNum++;
    candidateId = `${prefix}-${year}-${String(candidateNum).padStart(4, '0')}`;
  }
  return candidateId;
}

// 1. Check duplicate within user's specific college
router.post('/check-duplicate', authMiddleware, async (req, res) => {
  try {
    const { title = '', description = '', domain = '', zone = '', floor = '', roomOrArea = '' } = req.body;
    const institutionDomain = req.user.institutionDomain || 'campus.edu';

    if (!zone || (!title && !description)) {
      return res.json({ success: true, duplicateMatch: null });
    }

    const aiResult = await analyzeComplaint(title, description, domain, '');
    const duplicateMatch = await findDuplicateIncident({
      domain: aiResult.detectedDomain,
      zone,
      floor,
      roomOrArea,
      title,
      description,
      institutionDomain
    });

    res.json({
      success: true,
      detectedCategory: aiResult.detectedDomain,
      suggestedPriority: aiResult.priority,
      duplicateMatch: duplicateMatch?.isDuplicate ? duplicateMatch : null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Submit Concern (Scoped to User's College)
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      domain = 'General',
      zone,
      floor = 'Ground Floor',
      roomOrArea,
      evidencePhotoUrl = '',
      forceNewTicket = false
    } = req.body;

    const institutionDomain = req.user.institutionDomain || 'campus.edu';

    if (!title || !description || !zone || !roomOrArea) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the title, description, campus area, and specific room/spot.'
      });
    }

    const analysis = await analyzeComplaint(title, description, domain, evidencePhotoUrl);

    // If filed by a Teacher, bump priority if routine
    if (req.user.role === 'teacher' && analysis.priority === 'P4') {
      analysis.priority = 'P3';
    }

    // Check duplicate in same building within THIS college
    const duplicateCheck = await findDuplicateIncident({
      domain: analysis.detectedDomain,
      zone,
      floor,
      roomOrArea,
      title,
      description,
      institutionDomain
    });

    const ticketId = await generateNextTicketId(institutionDomain);

    // Merge if duplicate found
    if (duplicateCheck.isDuplicate && duplicateCheck.candidate && !forceNewTicket) {
      const parent = duplicateCheck.candidate;
      parent.cluster.affectedCount = (parent.cluster.affectedCount || 1) + 1;
      parent.cluster.subscribers.push({
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        joinedAt: new Date()
      });

      if (analysis.priority === 'P1' && parent.priority !== 'P1') {
        parent.priority = 'P1';
      }

      await parent.save();

      return res.status(201).json({
        success: true,
        isMerged: true,
        message: `This issue is already reported for ${parent.location.zone}. Your concern has been added to it to prioritize its resolution!`,
        ticket: parent
      });
    }

    const targetHours = analysis.slaTargetHours || 24;
    const deadline = calculateSlaDeadline(targetHours);

    const newTicket = await Complaint.create({
      ticketId,
      institutionDomain,
      title,
      description,
      domain: analysis.detectedDomain,
      location: { zone, floor, roomOrArea },
      reportedBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      status: 'Reported',
      priority: analysis.priority,
      aiAnalysis: {
        summary: `${analysis.detectedDomain} issue: ${title}`,
        isHazard: analysis.isHazard,
        damageSeverity: analysis.damageSeverity
      },
      cluster: {
        isParent: true,
        affectedCount: 1,
        subscribers: [{
          userId: req.user._id,
          name: req.user.name,
          email: req.user.email
        }]
      },
      media: { evidencePhotoUrl },
      assignedTo: {
        department: analysis.detectedDomain,
        technicianName: 'Not Assigned Yet'
      },
      sla: {
        targetHours,
        deadline,
        isBreached: false,
        escalationLevel: 0
      }
    });

    res.status(201).json({
      success: true,
      isMerged: false,
      message: 'Your concern has been submitted and queued for the maintenance team.',
      ticket: newTicket
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. List Concerns (Strictly isolated by user's institutionDomain)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { domain, priority, status, zone, search, myIssues, assignedToMe, institutionDomain: queryDomain } = req.query;
    const userDomain = req.user.institutionDomain || 'campus.edu';
    
    // Admin can view all or filter by queryDomain; others are strictly isolated to their own college
    const institutionDomain = req.user.role === 'admin' && queryDomain ? queryDomain : userDomain;
    const query = req.user.role === 'admin' && !queryDomain ? {} : { institutionDomain };

    if (domain && domain !== 'All') query.domain = domain;
    if (priority && priority !== 'All') query.priority = priority;
    if (status && status !== 'All') query.status = status;
    if (zone && zone !== 'All') query['location.zone'] = zone;

    query['cluster.isParent'] = true;

    if (myIssues === 'true') {
      delete query['cluster.isParent'];
      query.$or = [
        { 'reportedBy.userId': req.user._id },
        { 'cluster.subscribers.userId': req.user._id }
      ];
    }

    if (assignedToMe === 'true') {
      delete query['cluster.isParent'];
      query.$or = [
        { 'assignedTo.technicianId': req.user._id },
        { 'assignedTo.technicianName': new RegExp(req.user.name, 'i') }
      ];
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { ticketId: searchRegex },
          { title: searchRegex },
          { description: searchRegex },
          { 'location.roomOrArea': searchRegex }
        ]
      });
    }

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: complaints.length, complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Get Single Concern
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findOne(
      req.user.role === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, institutionDomain: req.user.institutionDomain || 'campus.edu' }
    );
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Concern not found or belongs to another institution.' });
    }
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Upvote Concern
router.post('/:id/upvote', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      institutionDomain: req.user.institutionDomain || 'campus.edu'
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const alreadySubscribed = complaint.cluster?.subscribers?.some(
      s => s.userId && s.userId.toString() === req.user._id.toString()
    );

    if (alreadySubscribed) {
      return res.status(400).json({ success: false, message: 'You have already added your vote.' });
    }

    complaint.cluster.affectedCount = (complaint.cluster.affectedCount || 1) + 1;
    complaint.cluster.subscribers.push({
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email
    });

    await complaint.save();
    res.json({
      success: true,
      message: 'Added your vote! The maintenance team can see multiple people waiting on this.',
      affectedCount: complaint.cluster.affectedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Assign Staff (HOD or Director)
router.put('/:id/assign', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['hod', 'director', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only HOD or Director can assign staff to campus concerns.'
      });
    }

    const { technicianName, priority } = req.body;
    const complaint = await Complaint.findOne(
      req.user.role === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, institutionDomain: req.user.institutionDomain || 'campus.edu' }
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (technicianName) {
      complaint.assignedTo.technicianName = technicianName;
      complaint.assignedTo.assignedAt = new Date();
      complaint.status = 'Assigned';
    }

    if (priority) complaint.priority = priority;

    await complaint.save();
    res.json({ success: true, message: `Assigned to ${technicianName}`, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Technician update (CANNOT CLOSE TICKET)
router.post('/:id/technician-update', authMiddleware, async (req, res) => {
  try {
    const allowedRoles = ['technician', 'hod', 'director', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only maintenance staff can update repair progress.' });
    }

    const { action, resolutionNotes = '', resolutionProofUrl = '' } = req.body;
    const complaint = await Complaint.findOne(
      req.user.role === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, institutionDomain: req.user.institutionDomain || 'campus.edu' }
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (action === 'start') {
      complaint.status = 'In_Progress';
      if (!complaint.assignedTo.technicianName || complaint.assignedTo.technicianName === 'Not Assigned Yet') {
        complaint.assignedTo.technicianName = req.user.name;
        complaint.assignedTo.technicianId = req.user._id;
      }
      await complaint.save();
      return res.json({ success: true, message: 'Work marked as In Progress.', complaint });
    }

    if (action === 'complete') {
      // Moves to Pending_Verification. Complainant MUST close it.
      complaint.status = 'Pending_Verification';
      complaint.media.resolutionProofUrl = resolutionProofUrl;
      complaint.media.resolutionNotes = resolutionNotes || `Repairs completed by ${req.user.name}. Awaiting complainant verification.`;

      await complaint.save();
      return res.json({
        success: true,
        message: 'Work marked as Completed! Ticket is now pending verification by the student/teacher who raised it.',
        complaint
      });
    }

    res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Complainant Verify & Close (Only student/teacher who raised it)
router.post('/:id/verify-and-close', authMiddleware, async (req, res) => {
  try {
    const { approved = true, rating = 5, feedback = '' } = req.body;
    const complaint = await Complaint.findOne(
      req.user.role === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, institutionDomain: req.user.institutionDomain || 'campus.edu' }
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const isReporter = complaint.reportedBy?.userId?.toString() === req.user._id.toString();
    const isSubscriber = complaint.cluster?.subscribers?.some(s => s.userId?.toString() === req.user._id.toString());
    const isUniversityHead = ['director', 'hod', 'admin'].includes(req.user.role);

    if (!isReporter && !isSubscriber && !isUniversityHead) {
      return res.status(403).json({
        success: false,
        message: 'Only the students or teachers who raised/joined this concern can close it after verifying.'
      });
    }

    if (approved) {
      complaint.status = 'Resolved';
      complaint.verification.verifiedByStudent = true;
      complaint.verification.studentRating = rating;
      complaint.verification.studentFeedback = feedback || 'Verified by complainant.';
      complaint.verification.verifiedAt = new Date();
      await complaint.save();

      return res.json({
        success: true,
        message: 'Thank you! You have confirmed the fix and the concern is now officially closed.',
        complaint
      });
    } else {
      complaint.status = 'In_Progress';
      complaint.verification.studentFeedback = `Issue not fixed yet: ${feedback}`;
      await complaint.save();

      return res.json({
        success: true,
        message: 'Concern reopened. Maintenance team has been notified that the issue persists.',
        complaint
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Director note
router.post('/:id/director-note', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'director') {
      return res.status(403).json({ success: false, message: 'Director access required.' });
    }

    const { note, priority } = req.body;
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      institutionDomain: req.user.institutionDomain || 'campus.edu'
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (note) complaint.media.resolutionNotes = `[Director Directive] ${note}`;
    if (priority) complaint.priority = priority;

    await complaint.save();
    res.json({ success: true, message: 'Director directive recorded.', complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
