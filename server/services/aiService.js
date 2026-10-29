/**
 * AI Service for Smart Campus
 * Provides multi-class categorization, hazard detection, urgency scoring,
 * technician repair recommendations, and damage severity analysis.
 */

const KEYWORD_RULES = {
  Electrical: {
    critical: ['spark', 'fire', 'shock', 'smoke', 'short circuit', 'live wire', 'burning smell', 'high voltage', 'blackout', 'explosion'],
    high: ['mcb trip', 'switchboard broken', 'no power', 'power outage', 'voltage fluctuation', 'generator down', 'transformer'],
    medium: ['tube light', 'fan not working', 'ac not cooling', 'socket damaged', 'ac remote', 'flickering light'],
    low: ['light dim', 'switch loose', 'indicator bulb'],
    tools: ['Digital Multimeter', 'Insulated Screwdriver Kit', 'Voltage Detector Pen', 'Wire Strippers', 'Thermal Scanner'],
    action: 'Isolate main breaker feed, test circuit voltage, inspect wire insulation, and replace faulty breaker/switch assembly.'
  },
  Plumbing: {
    critical: ['pipeline burst', 'major flood', 'water tank overflow', 'sewage backup', 'main line burst', 'contamination'],
    high: ['water leakage', 'no water supply', 'toilet overflow', 'geyser leaking', 'tap broken gushing', 'drain blocked completely'],
    medium: ['tap dripping', 'washbasin choke', 'flush valve stuck', 'low water pressure', 'shower leaking'],
    low: ['faucet loose', 'minor drip', 'drain cover missing'],
    tools: ['Adjustable Pipe Wrench', 'Plumber Snake / Auger', 'PTFE Thread Seal Tape', 'Pressure Gauge', 'Submersible Sump Pump'],
    action: 'Shut off zone supply valve, inspect joint gaskets/couplings, clear drain choke with auger, and replace compromised PVC/brass fittings.'
  },
  Civil: {
    critical: ['ceiling collapse', 'concrete falling', 'structural crack', 'window glass shattered', 'balcony railing loose', 'pillar crack'],
    high: ['door lock broken trapped', 'staircase marble broken', 'roof leak in rain', 'window pane missing', 'bench broken sharp edge'],
    medium: ['door hinge squeaking', 'floor tile cracked', 'plaster peeling off', 'desk wobbling', 'blackboard cracked'],
    low: ['paint peeling', 'minor wall scrape', 'curtain rod loose'],
    tools: ['Masonry Chisel & Hammer', 'Fast-setting Structural Epoxy', 'Safety Harness & Helmet', 'Level Tool', 'Power Drill & Anchors'],
    action: 'Cordon off immediate hazard perimeter, test structural load stability, clear debris, and reinforce with structural anchor/grout.'
  },
  Sanitation: {
    critical: ['hazardous chemical spill', 'medical waste dumped', 'dead animal', 'severe toxic odor', 'pest infestation food area'],
    high: ['garbage pile up', 'hostel washroom filthy', 'overflowing dustbin', 'canteen waste uncollected', 'maggots/insects'],
    medium: ['dustbin broken', 'corridor floor sticky', 'water cooler area dirty', 'soap dispenser empty'],
    low: ['minor litter', 'dust on tables', 'cobwebs in corridor'],
    tools: ['Industrial Disinfectant', 'Personal Protective Equipment (PPE)', 'Heavy Duty Mop & Wet Vac', 'Biohazard Disposal Bags'],
    action: 'Deploy emergency sanitation crew with PPE, apply neutralizer/disinfectant spray, thoroughly scrub area, and properly seal waste.'
  },
  IT_Network: {
    critical: ['campus fiber cut', 'server room down', 'core switch failure', 'firewall crash', 'exam portal down'],
    high: ['entire hostel wifi down', 'access point reboot loop', 'lab switch unpowered', 'ethernet cable snapped', 'lab router dead'],
    medium: ['slow wifi speed', 'frequent disconnection', 'specific classroom projector no signal', 'lan port loose'],
    low: ['printer driver issue', 'single port dust cap', 'cable tie untied'],
    tools: ['RJ45 Cable Tester', 'Crimping Tool & Cat6 Connectors', 'Console Cable / Laptop', 'PoE Network Tester'],
    action: 'Inspect upstream switch PoE output, verify VLAN gateway connectivity, test Cat6 patch continuity, and restart AP controller node.'
  }
};

/**
 * Intelligent AI analysis function
 * Analyzes title, description, domain, and optional image
 */
async function analyzeComplaint(title, description, userSelectedDomain = '', imageUrl = '') {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // 1. Detect Domain
  let detectedDomain = userSelectedDomain;
  let domainScores = { Electrical: 0, Plumbing: 0, Civil: 0, Sanitation: 0, IT_Network: 0 };
  
  for (const [domain, rules] of Object.entries(KEYWORD_RULES)) {
    const allDomainKeywords = [...rules.critical, ...rules.high, ...rules.medium, ...rules.low];
    for (const kw of allDomainKeywords) {
      if (combinedText.includes(kw)) {
        domainScores[domain] += kw.length > 6 ? 2 : 1;
      }
    }
  }

  // Pick top domain if user domain is generic or blank
  if (!detectedDomain || detectedDomain === 'General' || detectedDomain === 'Other') {
    const sorted = Object.entries(domainScores).sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] > 0) {
      detectedDomain = sorted[0][0];
    } else {
      detectedDomain = 'General';
    }
  }

  // 2. Detect Priority & Hazard
  let priority = 'P3';
  let isHazard = false;
  let damageSeverity = 5;
  const detectedKeywords = [];

  const domainRules = KEYWORD_RULES[detectedDomain] || KEYWORD_RULES.Electrical;

  // Check critical keywords
  for (const kw of domainRules.critical) {
    if (combinedText.includes(kw)) {
      priority = 'P1';
      isHazard = true;
      damageSeverity = 9;
      detectedKeywords.push(kw);
      break;
    }
  }

  // Check other domains for emergency keywords (e.g., live wire in bathroom)
  if (priority !== 'P1') {
    for (const [otherDomain, rules] of Object.entries(KEYWORD_RULES)) {
      for (const kw of rules.critical) {
        if (combinedText.includes(kw)) {
          priority = 'P1';
          isHazard = true;
          damageSeverity = 9;
          detectedKeywords.push(`${kw} (${otherDomain})`);
          break;
        }
      }
      if (priority === 'P1') break;
    }
  }

  // If not P1, check high
  if (priority !== 'P1') {
    for (const kw of domainRules.high) {
      if (combinedText.includes(kw)) {
        priority = 'P2';
        damageSeverity = 7;
        detectedKeywords.push(kw);
        break;
      }
    }
  }

  // If still not determined, check medium
  if (priority === 'P3') {
    for (const kw of domainRules.medium) {
      if (combinedText.includes(kw)) {
        damageSeverity = 5;
        detectedKeywords.push(kw);
        break;
      }
    }
  }

  // Check low
  if (priority === 'P3') {
    for (const kw of domainRules.low) {
      if (combinedText.includes(kw) && detectedKeywords.length === 0) {
        priority = 'P4';
        damageSeverity = 3;
        detectedKeywords.push(kw);
        break;
      }
    }
  }

  // If image provided, simulate CV inspection
  if (imageUrl) {
    if (imageUrl.includes('leak') || imageUrl.includes('water')) {
      damageSeverity = Math.max(damageSeverity, 7);
    }
    if (imageUrl.includes('spark') || imageUrl.includes('wire') || imageUrl.includes('burn')) {
      damageSeverity = Math.max(damageSeverity, 9);
      isHazard = true;
      priority = 'P1';
    }
  }

  // Map SLA Target Hours based on Priority
  const slaTargetHours = {
    P1: 2,   // 2 hours max
    P2: 8,   // 8 hours max
    P3: 24,  // 24 hours max
    P4: 48   // 48 hours max
  }[priority] || 24;

  // Generate Executive Summary
  const urgencyLabel = {
    P1: 'CRITICAL SAFETY HAZARD - Immediate Emergency Response Required',
    P2: 'HIGH OPERATIONAL IMPACT - Rapid Resolution Mandated',
    P3: 'MEDIUM ROUTINE ISSUE - Standard Maintenance Schedule',
    P4: 'LOW COSMETIC / SCHEDULED - Deferrable Maintenance'
  }[priority];

  const summary = `AI Analysis (${detectedDomain} | ${priority}): Issue involves "${title}". Severity scored at ${damageSeverity}/10. ${urgencyLabel}.`;

  const recommendedAction = domainRules.action || 'Deploy on-site technician to inspect physical premises, diagnose underlying cause, and replace defective parts.';
  const suggestedTools = domainRules.tools || ['Standard Toolkit', 'Safety Equipment'];

  return {
    detectedDomain,
    priority,
    isHazard,
    damageSeverity,
    slaTargetHours,
    summary,
    recommendedAction,
    suggestedTools,
    confidenceScore: 0.94,
    detectedKeywords
  };
}

module.exports = {
  analyzeComplaint,
  KEYWORD_RULES
};
