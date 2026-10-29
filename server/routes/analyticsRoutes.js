const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { authMiddleware } = require('../middleware/authMiddleware');

const CAMPUS_ZONES = [
  { name: 'Hostel Block A', lat: 28.5452, lng: 77.1921, capacity: '600 Students', type: 'Residential' },
  { name: 'Hostel Block B', lat: 28.5448, lng: 77.1934, capacity: '650 Students', type: 'Residential' },
  { name: 'Academic Block 1 (ECE/CSE)', lat: 28.5465, lng: 77.1915, capacity: '1200 Students', type: 'Academic' },
  { name: 'Academic Block 2 (Mech/Civil)', lat: 28.5471, lng: 77.1930, capacity: '1000 Students', type: 'Academic' },
  { name: 'Central Library', lat: 28.5458, lng: 77.1905, capacity: '800 Students', type: 'Academic' },
  { name: 'Student Mess & Dining', lat: 28.5442, lng: 77.1925, capacity: '1500 Meals/day', type: 'Dining' },
  { name: 'Science & Research Labs', lat: 28.5478, lng: 77.1910, capacity: '400 Researchers', type: 'Laboratory' },
  { name: 'Sports Complex', lat: 28.5435, lng: 77.1945, capacity: 'Open Facility', type: 'Recreational' }
];

router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const institutionDomain = req.user.institutionDomain || 'campus.edu';
    const allComplaints = await Complaint.find({ institutionDomain });

    const totalReported = allComplaints.length;
    const resolved = allComplaints.filter(c => c.status === 'Resolved').length;
    const active = allComplaints.filter(c => c.status !== 'Resolved').length;
    const criticalP1 = allComplaints.filter(c => c.priority === 'P1' && c.status !== 'Resolved').length;
    const breachedSla = allComplaints.filter(c => c.sla && c.sla.isBreached).length;
    const escalated = allComplaints.filter(c => c.status === 'Escalated').length;

    // Clustering Efficiency Metric: Total affected count across parents vs actual parent tickets
    const parentTickets = allComplaints.filter(c => c.cluster.isParent);
    const totalAffectedUsers = parentTickets.reduce((sum, c) => sum + (c.cluster.affectedCount || 1), 0);
    const duplicatesPrevented = totalAffectedUsers - parentTickets.length;

    // Domain Breakdown
    const domainCounts = {
      Electrical: 0,
      Plumbing: 0,
      Civil: 0,
      Sanitation: 0,
      IT_Network: 0,
      General: 0
    };
    allComplaints.forEach(c => {
      if (domainCounts[c.domain] !== undefined) {
        domainCounts[c.domain]++;
      } else {
        domainCounts.General++;
      }
    });

    // Priority Breakdown
    const priorityCounts = { P1: 0, P2: 0, P3: 0, P4: 0 };
    allComplaints.forEach(c => {
      if (priorityCounts[c.priority] !== undefined) {
        priorityCounts[c.priority]++;
      }
    });

    // Campus Heatmap Zone Aggregation
    const zoneHeatmap = CAMPUS_ZONES.map(zoneInfo => {
      const zoneTickets = allComplaints.filter(c => c.location && c.location.zone === zoneInfo.name);
      const activeTickets = zoneTickets.filter(c => c.status !== 'Resolved');
      const p1Hazards = activeTickets.filter(c => c.priority === 'P1').length;
      
      // Calculate domain frequency for zone
      const domainFreq = {};
      zoneTickets.forEach(t => {
        domainFreq[t.domain] = (domainFreq[t.domain] || 0) + 1;
      });
      let dominantDomain = 'None';
      let maxCount = 0;
      for (const [dom, count] of Object.entries(domainFreq)) {
        if (count > maxCount) {
          maxCount = count;
          dominantDomain = dom;
        }
      }

      // Chronic hotspot threshold: 3 or more issues in same domain in this zone
      const isChronicHotspot = maxCount >= 3;
      const severityScore = activeTickets.reduce((acc, t) => acc + (t.aiAnalysis?.damageSeverity || 4), 0);

      return {
        ...zoneInfo,
        totalTickets: zoneTickets.length,
        activeTickets: activeTickets.length,
        p1Hazards,
        dominantDomain,
        dominantDomainCount: maxCount,
        isChronicHotspot,
        hotspotSeverity: severityScore,
        preventativeAlert: isChronicHotspot
          ? `Advisory: Chronic ${dominantDomain} issues detected (${maxCount} reports). Recommend preventative overhaul of this facility.`
          : null
      };
    });

    res.json({
      success: true,
      metrics: {
        totalReported,
        active,
        resolved,
        resolutionRate: totalReported > 0 ? Math.round((resolved / totalReported) * 100) : 0,
        criticalP1,
        breachedSla,
        escalated,
        duplicatesPrevented,
        slaComplianceRate: totalReported > 0 ? Math.round(((totalReported - breachedSla) / totalReported) * 100) : 100
      },
      domainDistribution: domainCounts,
      priorityDistribution: priorityCounts,
      zoneHeatmap
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
