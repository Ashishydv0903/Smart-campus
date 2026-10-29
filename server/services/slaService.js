const Complaint = require('../models/Complaint');

const ESCALATION_TIERS = {
  1: 'Maintenance Supervisor',
  2: 'Head of Department (HOD)',
  3: 'Campus Director'
};

/**
 * Calculates deadline date based on priority target hours
 */
function calculateSlaDeadline(targetHours) {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + targetHours);
  return deadline;
}

/**
 * Scans active complaints for breached deadlines and escalates them automatically
 */
async function checkAndEscalateTickets() {
  const now = new Date();

  // Find active, unresolved complaints
  const openComplaints = await Complaint.find({
    status: { $in: ['Reported', 'In_Review', 'Assigned', 'In_Progress', 'Escalated'] }
  });

  const escalatedList = [];

  for (const ticket of openComplaints) {
    if (!ticket.sla || !ticket.sla.deadline) continue;

    const isOverdue = now > new Date(ticket.sla.deadline);

    if (isOverdue) {
      ticket.sla.isBreached = true;
      const overdueMinutes = Math.round((now - new Date(ticket.sla.deadline)) / (1000 * 60));
      ticket.sla.breachDurationMinutes = overdueMinutes;

      // Determine escalation level based on overdue duration and priority
      let newLevel = ticket.sla.escalationLevel || 0;
      
      // If overdue by more than 2x target hours or P1 critical, escalate directly to Director
      if (ticket.priority === 'P1' || overdueMinutes > (ticket.sla.targetHours * 60 * 1.5)) {
        newLevel = 3;
      } else if (overdueMinutes > (ticket.sla.targetHours * 60 * 0.5)) {
        newLevel = Math.max(newLevel, 2);
      } else {
        newLevel = Math.max(newLevel, 1);
      }

      if (newLevel > (ticket.sla.escalationLevel || 0) || !ticket.sla.isBreached) {
        ticket.sla.escalationLevel = newLevel;
        ticket.sla.escalatedToRole = ESCALATION_TIERS[newLevel] || 'Campus Director';
        ticket.sla.escalatedAt = now;
        ticket.status = 'Escalated';

        await ticket.save();
        escalatedList.push({
          ticketId: ticket.ticketId,
          title: ticket.title,
          priority: ticket.priority,
          level: newLevel,
          escalatedTo: ticket.sla.escalatedToRole,
          overdueMinutes
        });
      }
    }
  }

  return escalatedList;
}

/**
 * Start background SLA watchdog timer
 */
function startSlaWatchdog(intervalSeconds = 60) {
  console.log(`[SLA Watchdog] Initialized. Monitoring active SLAs every ${intervalSeconds}s.`);
  setInterval(async () => {
    try {
      const escalated = await checkAndEscalateTickets();
      if (escalated.length > 0) {
        console.log(`[SLA Watchdog] Auto-escalated ${escalated.length} overdue campus complaints.`);
      }
    } catch (err) {
      console.error('[SLA Watchdog Error]', err.message);
    }
  }, intervalSeconds * 1000);
}

module.exports = {
  calculateSlaDeadline,
  checkAndEscalateTickets,
  startSlaWatchdog,
  ESCALATION_TIERS
};
