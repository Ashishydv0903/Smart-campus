const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Institution = require('./models/Institution');
const { calculateSlaDeadline } = require('./services/slaService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_campus_db';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected to MongoDB at', MONGO_URI);

    // Clear existing collections
    await User.deleteMany({});
    await Complaint.deleteMany({});
    await Institution.deleteMany({});

    // 1. Seed Whitelisted Institutions (Multi-College Domain Whitelist)
    const institutions = await Institution.insertMany([
      {
        name: 'Apex Institute of Technology',
        domain: 'campus.edu',
        code: 'AIT',
        isActive: true,
        registeredStudentsCount: 5
      },
      {
        name: 'KIT College of Engineering',
        domain: 'kit.edu',
        code: 'KIT',
        isActive: true,
        registeredStudentsCount: 2
      },
      {
        name: 'IIT Delhi',
        domain: 'iitd.ac.in',
        code: 'IITD',
        isActive: true,
        registeredStudentsCount: 0
      }
    ]);
    console.log(`[Seed] Whitelisted ${institutions.length} approved college domains.`);

    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@SecurePass2026';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 2. Seed Users across the colleges
    const users = await User.insertMany([
      {
        name: process.env.ADMIN_NAME || 'Ashish Yadav',
        email: (process.env.ADMIN_EMAIL || 'ashish.admin@campus.edu').toLowerCase(),
        prn: process.env.ADMIN_PRN || 'admin',
        password: hashedAdminPassword,
        role: 'admin',
        institutionDomain: process.env.ADMIN_DOMAIN || 'campus.edu',
        department: 'Platform Administration',
        campusZone: 'Main Administrative Block'
      },
      {
        name: 'Aarav Sharma',
        email: 'aarav@campus.edu',
        prn: '2026CS101',
        password: hashedPassword,
        role: 'student',
        institutionDomain: 'campus.edu',
        department: 'Computer Science',
        campusZone: 'Hostel Block A'
      },
      {
        name: 'Dr. Ananya Sen',
        email: 'ananya.faculty@campus.edu',
        prn: 'FAC-CS-02',
        password: hashedPassword,
        role: 'teacher',
        institutionDomain: 'campus.edu',
        department: 'Computer Science',
        campusZone: 'Academic Block 1 (ECE/CSE)'
      },
      {
        name: 'Prof. R. K. Sharma',
        email: 'hod.ece@campus.edu',
        prn: 'HOD-EE-01',
        password: hashedPassword,
        role: 'hod',
        institutionDomain: 'campus.edu',
        department: 'Electrical',
        campusZone: 'Academic Block 1 (ECE/CSE)'
      },
      {
        name: 'Dr. V. K. Bansal',
        email: 'director@campus.edu',
        prn: 'DIR-01',
        password: hashedPassword,
        role: 'director',
        institutionDomain: 'campus.edu',
        department: 'Administration',
        campusZone: 'Central Library'
      },
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.electric@campus.edu',
        prn: 'TECH-ELEC-01',
        password: hashedPassword,
        role: 'technician',
        institutionDomain: 'campus.edu',
        department: 'Electrical',
        campusZone: 'Academic Block 1 (ECE/CSE)'
      },
      // Student at KIT College of Engineering
      {
        name: 'Rohit Kulkarni',
        email: 'rohit@kit.edu',
        prn: '2026KIT042',
        password: hashedPassword,
        role: 'student',
        institutionDomain: 'kit.edu',
        department: 'Mechanical',
        campusZone: 'Main Engineering Block'
      }
    ]);
    console.log(`[Seed] Seeded ${users.length} authenticated users.`);

    const [adminUser, aarav, ananya, hod, director, rajesh, rohit] = users;

    // 3. Seed Realistic Concerns (Separated by institutionDomain)
    const complaints = [
      {
        ticketId: 'AIT-2026-1001',
        institutionDomain: 'campus.edu',
        title: 'Open sparking switchboard with burning smell in Lab 204',
        description: 'The main switchboard in Computer Lab 204 is sparking when heavy systems are powered on. Strong burning plastic smell.',
        domain: 'Electrical',
        location: {
          zone: 'Academic Block 1 (ECE/CSE)',
          floor: '2nd Floor',
          roomOrArea: 'Computer Lab 204'
        },
        reportedBy: {
          userId: ananya._id,
          name: ananya.name,
          email: ananya.email,
          role: 'teacher'
        },
        status: 'In_Progress',
        priority: 'P1',
        cluster: {
          isParent: true,
          affectedCount: 4,
          subscribers: [
            { userId: ananya._id, name: ananya.name, email: ananya.email },
            { userId: aarav._id, name: aarav.name, email: aarav.email }
          ]
        },
        assignedTo: {
          technicianId: rajesh._id,
          technicianName: rajesh.name,
          department: 'Electrical'
        },
        sla: {
          targetHours: 2,
          deadline: calculateSlaDeadline(2)
        }
      },
      {
        ticketId: 'AIT-2026-1002',
        institutionDomain: 'campus.edu',
        title: 'Water pipe leaking and corridor floor wet',
        description: 'The pipe under the sink row in Hostel Block B is leaking continuously. Water is spreading into the corridor.',
        domain: 'Plumbing',
        location: {
          zone: 'Hostel Block B',
          floor: '2nd Floor',
          roomOrArea: 'East Wing Washrooms'
        },
        reportedBy: {
          userId: aarav._id,
          name: aarav.name,
          email: aarav.email,
          role: 'student'
        },
        status: 'Pending_Verification',
        priority: 'P2',
        cluster: {
          isParent: true,
          affectedCount: 8,
          subscribers: [
            { userId: aarav._id, name: aarav.name, email: aarav.email }
          ]
        },
        assignedTo: {
          technicianName: 'Suresh (Plumber)',
          department: 'Plumbing'
        },
        media: {
          resolutionNotes: 'Replaced pipe joint washer and sealed the fitting. Tested with high water pressure.'
        },
        sla: {
          targetHours: 8,
          deadline: calculateSlaDeadline(8)
        }
      },
      // Concern for KIT College
      {
        ticketId: 'KIT-2026-1001',
        institutionDomain: 'kit.edu',
        title: 'Broken bench in Mechanical CAD Lab',
        description: 'Two wooden desks on row 2 have broken leg supports with sharp nails exposed.',
        domain: 'Civil',
        location: {
          zone: 'Main Engineering Block',
          floor: '1st Floor',
          roomOrArea: 'CAD Lab 102'
        },
        reportedBy: {
          userId: rohit._id,
          name: rohit.name,
          email: rohit.email,
          role: 'student'
        },
        status: 'Reported',
        priority: 'P3',
        cluster: {
          isParent: true,
          affectedCount: 2,
          subscribers: [{ userId: rohit._id, name: rohit.name, email: rohit.email }]
        },
        sla: {
          targetHours: 24,
          deadline: calculateSlaDeadline(24)
        }
      }
    ];

    await Complaint.insertMany(complaints);
    console.log(`[Seed] Seeded ${complaints.length} concerns isolated by college domain.`);

    console.log('[Seed] Database initialization complete.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
}

seedDatabase();
