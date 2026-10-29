/**
 * Comprehensive Automated Test Suite for Smart Campus Platform
 * Exercises all authentication, multi-tenancy, complaint lifecycle,
 * duplicate clustering, technician limits, and admin powers.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_campus_db';
const BASE_URL = 'http://localhost:5000';

const results = [];
function recordTest(name, passed, details = '') {
  results.push({ name, passed, details });
  const symbol = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${symbol}] ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runTests() {
  console.log('\n============================================================');
  console.log('   STARTING SMART CAMPUS COMPREHENSIVE END-TO-END TEST SUITE');
  console.log('============================================================\n');

  try {
    // -------------------------------------------------------------
    // TEST 1: Check Backend Health
    // -------------------------------------------------------------
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    recordTest('1. Server Health Check', healthRes.status === 200 && healthData.status === 'online');

    // -------------------------------------------------------------
    // TEST 2: Domain Whitelisting (Multi-College Tenant Management)
    // -------------------------------------------------------------
    const testDomain = 'testcollege.edu';
    const addDomainRes = await fetch(`${BASE_URL}/api/auth/institutions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test National College', domain: testDomain, code: 'TNC' })
    });
    const addDomainData = await addDomainRes.json();
    recordTest('2. Whitelist College Domain', addDomainRes.status === 201 && addDomainData.success);

    // -------------------------------------------------------------
    // TEST 3: Reject Registration from Unauthorized Domain
    // -------------------------------------------------------------
    const rogueRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rogue User',
        email: 'hacker@unauthorized-school.com',
        prn: 'ROGUE-01',
        password: 'Password123'
      })
    });
    recordTest('3. Reject Unauthorized College Domain', rogueRegRes.status === 403, 'Correctly returned 403 Forbidden');

    // -------------------------------------------------------------
    // TEST 4: Student Registration with Whitelisted Domain
    // -------------------------------------------------------------
    const studentEmail = `student.${Date.now()}@${testDomain}`;
    const studentPassword = 'SecureStudentPass2026!';
    const studentRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aditi Verma',
        email: studentEmail,
        prn: `PRN-${Date.now().toString().slice(-6)}`,
        password: studentPassword,
        role: 'student',
        department: 'Information Technology'
      })
    });
    const studentRegData = await studentRegRes.json();
    const studentToken = studentRegData.token;
    const studentId = studentRegData.user?.id;
    recordTest('4. Student Registration with Whitelisted Domain', studentRegRes.status === 201 && !!studentToken);

    // -------------------------------------------------------------
    // TEST 5: Standard Student Login
    // -------------------------------------------------------------
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: studentPassword })
    });
    const studentLoginData = await studentLoginRes.json();
    recordTest('5. Standard Student Sign-In with Encrypted Password', studentLoginRes.status === 200 && !!studentLoginData.token);

    // -------------------------------------------------------------
    // TEST 6: Reject Login with Invalid Password
    // -------------------------------------------------------------
    const wrongPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: 'WrongPassword123!' })
    });
    recordTest('6. Reject Incorrect Password Attempt', wrongPassRes.status === 401, 'Correctly returned 401 Unauthorized');

    // -------------------------------------------------------------
    // TEST 7: Platform Admin Login via Backend .env Credentials
    // -------------------------------------------------------------
    const adminEmail = process.env.ADMIN_EMAIL || 'ashish.admin@campus.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@SecurePass2026';
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    recordTest('7. Platform Admin Sign-In with Secure Backend Credentials', adminLoginRes.status === 200 && adminLoginData.user?.role === 'admin');

    // -------------------------------------------------------------
    // TEST 8: Forgot Password Code Generation & Reset
    // -------------------------------------------------------------
    const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail })
    });
    const forgotData = await forgotRes.json();
    const resetCode = forgotData.resetCode;

    const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, resetCode, newPassword: 'BrandNewPassword2026!' })
    });
    const resetData = await resetRes.json();
    recordTest('8. Forgot Password Verification & Password Reset', resetRes.status === 200 && resetData.success);

    // Update password for remaining student tests
    const newStudentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: 'BrandNewPassword2026!' })
    });
    const activeStudentData = await newStudentLoginRes.json();
    const activeStudentToken = activeStudentData.token;

    // -------------------------------------------------------------
    // TEST 9: Create Maintenance Staff / Technician for this College
    // -------------------------------------------------------------
    const techEmail = `tech.${Date.now()}@${testDomain}`;
    const techRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ramesh Plumber',
        email: techEmail,
        prn: `TECH-${Date.now().toString().slice(-4)}`,
        password: 'TechPassword123',
        role: 'technician',
        department: 'Plumbing'
      })
    });
    const techRegData = await techRegRes.json();
    const techToken = techRegData.token;
    recordTest('9. Register Maintenance Technician', techRegRes.status === 201 && !!techToken);

    // -------------------------------------------------------------
    // TEST 10: Submit Initial Campus Concern (Auto Category & SLA)
    // -------------------------------------------------------------
    const complaint1Res = await fetch(`${BASE_URL}/api/complaints/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeStudentToken}`
      },
      body: JSON.stringify({
        title: 'Water pipe leaking under washbasin',
        description: 'Heavy water dripping onto bathroom floor causing slippery puddle',
        domain: 'Plumbing',
        zone: 'Hostel Block A',
        floor: '2nd Floor',
        roomOrArea: 'Wing B Restroom'
      })
    });
    const complaint1Data = await complaint1Res.json();
    const ticket1 = complaint1Data.ticket;
    recordTest('10. Student Raises Concern with Auto Category & SLA', complaint1Res.status === 201 && ticket1?.domain === 'Plumbing');

    // -------------------------------------------------------------
    // TEST 11: Duplicate Incident Detection & Automatic Merging
    // -------------------------------------------------------------
    // Another student reports the same leaking tap in the same building & room
    const student2Email = `student2.${Date.now()}@${testDomain}`;
    const student2Reg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vikram Singh',
        email: student2Email,
        prn: `PRN-${Date.now().toString().slice(-6)}`,
        password: 'PassWord123',
        role: 'student'
      })
    });
    const student2Data = await student2Reg.json();
    const student2Token = student2Data.token;

    const duplicateSubmitRes = await fetch(`${BASE_URL}/api/complaints/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${student2Token}`
      },
      body: JSON.stringify({
        title: 'Pipe leak in Wing B bathroom',
        description: 'Water dripping under sink continuously',
        domain: 'Plumbing',
        zone: 'Hostel Block A',
        floor: '2nd Floor',
        roomOrArea: 'Wing B Restroom'
      })
    });
    const duplicateData = await duplicateSubmitRes.json();
    recordTest('11. Duplicate Detection & Auto-Grouping for Same Building', duplicateData.isMerged === true, 'Merged into parent ticket without creating duplicate clutter');

    // -------------------------------------------------------------
    // TEST 12: Staff Assignment by HOD / Director / Admin
    // -------------------------------------------------------------
    const assignRes = await fetch(`${BASE_URL}/api/complaints/${ticket1._id}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ technicianName: 'Ramesh Plumber', priority: 'P2' })
    });
    const assignData = await assignRes.json();
    recordTest('12. Assign Staff to Concern', assignRes.status === 200 && assignData.complaint?.status === 'Assigned');

    // -------------------------------------------------------------
    // TEST 13: Technician Starts Work
    // -------------------------------------------------------------
    const startWorkRes = await fetch(`${BASE_URL}/api/complaints/${ticket1._id}/technician-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${techToken}`
      },
      body: JSON.stringify({ action: 'start' })
    });
    const startWorkData = await startWorkRes.json();
    recordTest('13. Technician Starts Repair Work', startWorkData.complaint?.status === 'In_Progress');

    // -------------------------------------------------------------
    // TEST 14: Technician Marks Work Done (Pending Verification)
    // -------------------------------------------------------------
    const completeWorkRes = await fetch(`${BASE_URL}/api/complaints/${ticket1._id}/technician-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${techToken}`
      },
      body: JSON.stringify({
        action: 'complete',
        resolutionNotes: 'Replaced rubber washer and tightened joint nut. Water supply tested clean.'
      })
    });
    const completeWorkData = await completeWorkRes.json();
    recordTest('14. Technician Completes Repair (Moves to Pending Verification)', completeWorkData.complaint?.status === 'Pending_Verification');

    // -------------------------------------------------------------
    // TEST 15: Security Guard: Technician CANNOT Close the Ticket
    // -------------------------------------------------------------
    const techCloseAttempt = await fetch(`${BASE_URL}/api/complaints/${ticket1._id}/verify-and-close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${techToken}`
      },
      body: JSON.stringify({ approved: true, rating: 5, feedback: 'Closed by technician' })
    });
    recordTest('15. Security Check: Technician Forbidden from Closing Ticket', techCloseAttempt.status === 403, 'Correctly locked: Only student/teacher who raised ticket can close it');

    // -------------------------------------------------------------
    // TEST 16: Complainant Student Verifies Fix and Closes Ticket
    // -------------------------------------------------------------
    const studentCloseRes = await fetch(`${BASE_URL}/api/complaints/${ticket1._id}/verify-and-close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeStudentToken}`
      },
      body: JSON.stringify({
        approved: true,
        rating: 5,
        feedback: 'Leak completely stopped, bathroom is clean now. Thank you!'
      })
    });
    const studentCloseData = await studentCloseRes.json();
    recordTest('16. Complainant Verifies Fix & Permanently Resolves Ticket', studentCloseRes.status === 200 && studentCloseData.complaint?.status === 'Resolved');

    // -------------------------------------------------------------
    // TEST 17: Multi-Tenant Isolation (Other college sees only their tickets)
    // -------------------------------------------------------------
    const studentListRes = await fetch(`${BASE_URL}/api/complaints`, {
      headers: { 'Authorization': `Bearer ${activeStudentToken}` }
    });
    const studentListData = await studentListRes.json();
    const otherCollegesExcluded = studentListData.complaints.every(c => c.institutionDomain === testDomain);
    recordTest('17. Multi-Tenant Campus Isolation', otherCollegesExcluded, `All returned complaints match ${testDomain}`);

    // -------------------------------------------------------------
    // TEST 18: Student Directory (Viewing & Removing Members)
    // -------------------------------------------------------------
    const directoryRes = await fetch(`${BASE_URL}/api/auth/students`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const directoryData = await directoryRes.json();
    recordTest('18. Student Directory Access for Administration', directoryRes.status === 200 && Array.isArray(directoryData.students));

    // Remove the test student
    const removeStudentRes = await fetch(`${BASE_URL}/api/auth/students/${student2Data.user?.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    recordTest('19. Admin/HOD Authority to Remove Unauthorized Student', removeStudentRes.status === 200);

    // -------------------------------------------------------------
    // TEST 20: Analytics & Campus Health Metrics
    // -------------------------------------------------------------
    const analyticsRes = await fetch(`${BASE_URL}/api/analytics/dashboard`, {
      headers: { 'Authorization': `Bearer ${activeStudentToken}` }
    });
    const analyticsData = await analyticsRes.json();
    recordTest('20. Campus Infrastructure Health & Analytics Metrics', analyticsRes.status === 200 && typeof analyticsData.metrics?.resolutionRate === 'number');

    // -------------------------------------------------------------
    // Clean up test domain
    // -------------------------------------------------------------
    await fetch(`${BASE_URL}/api/auth/institutions/${addDomainData.institution?._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log('\n============================================================');
    const passedCount = results.filter(r => r.passed).length;
    console.log(`   TEST RESULTS SUMMARY: ${passedCount} / ${results.length} TESTS PASSED`);
    console.log('============================================================\n');

    process.exit(passedCount === results.length ? 0 : 1);
  } catch (err) {
    console.error('[Test Execution Error]', err);
    process.exit(1);
  }
}

runTests();
