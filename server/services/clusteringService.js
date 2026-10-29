const Complaint = require('../models/Complaint');

/**
 * Tokenize and normalize text into clean words
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'this', 'that', 'not', 'are', 'was'].includes(w));
}

/**
 * Compute Jaccard Similarity between two sets of tokens
 */
function computeJaccardSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }

  const unionSize = new Set([...tokensA, ...tokensB]).size;
  return unionSize === 0 ? 0 : (intersectionCount / unionSize);
}

/**
 * Evaluates whether an incoming complaint is a duplicate of an existing active incident within the same college
 */
async function findDuplicateIncident({ domain, zone, floor, roomOrArea, title, description, institutionDomain = 'campus.edu' }) {
  // Query only open complaints in the SAME college and zone
  const activeComplaints = await Complaint.find({
    institutionDomain,
    'location.zone': zone,
    domain: domain,
    status: { $in: ['Reported', 'In_Review', 'Assigned', 'In_Progress', 'Escalated'] },
    'cluster.isParent': true
  });

  if (!activeComplaints || activeComplaints.length === 0) {
    return { isDuplicate: false, candidate: null, similarityScore: 0 };
  }

  const newTokens = tokenize(`${title} ${description} ${floor} ${roomOrArea}`);

  let bestMatch = null;
  let highestScore = 0;
  let matchReason = '';

  for (const active of activeComplaints) {
    const existingTokens = tokenize(`${active.title} ${active.description} ${active.location.floor} ${active.location.roomOrArea}`);
    const textSimilarity = computeJaccardSimilarity(newTokens, existingTokens);

    const sameRoom = (active.location.roomOrArea && roomOrArea && 
      active.location.roomOrArea.toLowerCase().trim() === roomOrArea.toLowerCase().trim());
    const sameFloor = (active.location.floor && floor && 
      active.location.floor.toLowerCase().trim() === floor.toLowerCase().trim());

    let finalScore = textSimilarity;

    if (sameRoom) {
      finalScore += 0.35;
    } else if (sameFloor) {
      finalScore += 0.15;
    }

    if (finalScore > highestScore) {
      highestScore = finalScore;
      bestMatch = active;
      matchReason = sameRoom 
        ? `Identical room (${roomOrArea})`
        : `Same floor (${floor}) with matching problem symptoms`;
    }
  }

  if (highestScore >= 0.40 && bestMatch) {
    return {
      isDuplicate: true,
      candidate: bestMatch,
      similarityScore: Number(highestScore.toFixed(2)),
      matchReason
    };
  }

  return { isDuplicate: false, candidate: null, similarityScore: Number(highestScore.toFixed(2)) };
}

module.exports = {
  findDuplicateIncident,
  tokenize,
  computeJaccardSimilarity
};
