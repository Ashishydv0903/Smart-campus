# 🏫 Smart Campus – AI-Powered Complaint Management & Resolution System

> **An innovative, role-governed, multi-tenant campus infrastructure maintenance platform designed for educational institutions.**  
> *Aligned with Smart India Hackathon (SIH) problem definitions on automated governance and campus sustainability.*

---

## 📌 Executive Summary

In higher education institutions, infrastructural breakdowns (**damaged switchboards, water leakage, Wi-Fi downtime, cleanliness issues, broken furniture**) often go reported through informal, scattered channels.

Traditional complaint systems face four major challenges:
1. **The Duplicate Flood Trap:** Multiple students lodge separate complaints for the same incident (e.g. 20 tickets for a broken hostel tap), overwhelming administrators.
2. **Lack of Priority Awareness:** Urgent hazards (sparking electrical boards or ceiling fractures) sit in the same queue as routine requests.
3. **Premature Ticket Closure:** Maintenance staff mark tickets as "Resolved" without on-site student verification.
4. **Lack of Institutional Domain Control:** Anyone with an outside email can lodge rogue complaints.

**Smart Campus** solves this with **Multi-Tenant Domain Whitelisting**, **Automatic Category & SLA Detection**, **Same-Building Duplicate Clustering**, and a **Strict Two-Way Verification Loop** where only the reporting student/teacher can close the ticket after rating the fix.

---

## 👥 Role-Based Access Control (RBAC) Matrix

| Role | Primary Functions | Key Actions & Authority |
| :--- | :--- | :--- |
| 🎓 **Student** | Complainant & Verifier | • Lodge complaints with photo evidence.<br>• Auto-merge or upvote existing incidents in the same building.<br>• **Inspect & Close:** Rate fixes (1–5 stars) before tickets permanently close. |
| 👩‍🏫 **Faculty / Teacher** | Complainant & Verifier | • Report classroom, departmental, and research lab issues.<br>• Faculty complaints receive automatic priority weighting. |
| 🏛️ **HOD (Head of Dept)** | Operational Monitor | • Inspect departmental issues.<br>• Dispatch and assign maintenance technicians.<br>• Access Student Directory to review and remove rogue users. |
| 👑 **Campus Director** | Executive Monitor | • Campus-wide oversight across all sectors.<br>• Direct executive resolution sign-off and recorded directives. |
| 🔧 **Maintenance Staff** | Repair Executor | • View assigned repair tasks.<br>• Upload before/after proof photos.<br>• **Cannot close tickets** (must submit to student for inspection). |
| 🛡️ **Platform Administrator** | Multi-College Authority | • Whitelist, suspend, or delete authorized college domains.<br>• Cross-college infrastructure oversight. |

---

## 🚀 Key Innovations & Practical Features

- **Multi-Tenant College Isolation:** Each university's complaints and users are strictly isolated by their institutional domain (`@galgotiacollege.edu`, `@campus.edu`, `@iitd.ac.in`).
- **Same-Building Duplicate Clustering:** When an incident is reported in a building where a similar problem is already pending, the system offers an instant **"+1 Me Too"** consolidation to avoid redundant tickets.
- **Visual 5-Step Lifecycle Stepper:** Clean progress tracker (`1. Submitted` ➔ `2. Staff Assigned` ➔ `3. In Repair` ➔ `4. Inspection` ➔ `5. Verified & Closed`).
- **Direct Camera & Photo Upload:** Built-in file picker with instant live thumbnail preview and photo removal for both students and technicians.
- **Printable Confirmation Slip:** One-click **"Print Slip"** button on each ticket to generate official paper/PDF receipts for hostel warden submission.
- **Campus Facility Health Metric Cards:** Overview displaying Facility Health %, Active Repairs, Reports Merged, and Urgent Hazards.
- **Quick-Filter Pills:** Fast one-tap category and priority chips for rapid incident navigation.

---

## 🛠️ Technology Stack

- **Frontend:** React.js 18 (Vite), Tailwind CSS, Lucide React Icons
- **Backend:** Node.js, Express.js REST APIs
- **Database:** MongoDB (Local instance or MongoDB Atlas Cloud) via Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT), Bcrypt password hashing, Institutional Domain Whitelisting
- **Testing:** Comprehensive automated end-to-end test suite (`npm test`)

---

## ⚙️ Environment Variables Configuration

Copy `.env.example` into `server/.env`:

```bash
cp .env.example server/.env
```

### `server/.env` File Content:

```env
# Network Port
PORT=5000

# MongoDB Connection String (Option A: Local MongoDB, Option B: MongoDB Atlas)
MONGO_URI=mongodb://127.0.0.1:27017/smart_campus_db
# Or MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/smart_campus_db?retryWrites=true&w=majority

# JWT Token Secret Key
JWT_SECRET=super_secret_smart_campus_jwt_token_key_2026

# Platform Administrator Account (Managed securely on backend)
ADMIN_NAME=Platform Administrator
ADMIN_EMAIL=admin@campus.edu
ADMIN_PRN=admin
ADMIN_PASSWORD=Admin@SecurePass2026
ADMIN_DOMAIN=campus.edu
```

---

## 🏁 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI.

### 2. Backend Setup
```bash
cd server
npm install
npm run seed      # Initializes approved college domains and users
npm run dev       # Starts Express backend at http://localhost:5000
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev       # Starts React Vite client at http://localhost:3000
```

### 4. Run Automated Test Suite
From the `server` folder, run:
```bash
npm test
```
*Executes all 20 end-to-end automated tests covering multi-tenancy, authentication, complaint lifecycles, duplicate merging, and security constraints.*

---

## 🔑 Administrator CLI Utility

To update or set new administrator credentials directly from the command line:

```bash
cd server
npm run set-admin <admin-email> <new-password> "<admin-name>" <admin-prn>
```

*Example:*
```bash
npm run set-admin ashish.admin@campus.edu MyStrongPass2026! "Ashish Yadav" admin
```

---

## 📁 Repository Structure

```
smart-campus-ai/
├── .env.example                # Root environment template
├── .gitignore                  # Git ignore rules (node_modules, .env, build)
├── README.md                   # Project documentation
│
├── server/                     # Express.js REST API Backend
│   ├── .env.example            # Backend environment template
│   ├── index.js                # Server entry point & watchdog daemon
│   ├── seed.js                 # Database seeder
│   ├── package.json            # Server scripts and dependencies
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT authentication & role guards
│   ├── models/
│   │   ├── User.js             # User schema with domain & roles
│   │   ├── Complaint.js        # Complaint schema with lifecycle states
│   │   └── Institution.js      # Authorized college domain schema
│   ├── routes/
│   │   ├── authRoutes.js       # Auth, institutions & student directory
│   │   ├── complaintRoutes.js  # Complaint submission, merge & verification
│   │   └── analyticsRoutes.js  # Campus facility metrics & SLA analysis
│   ├── services/
│   │   ├── adminService.js     # Admin bootstrap synchronization
│   │   ├── aiService.js        # Automatic categorization & priority triage
│   │   ├── clusteringService.js# Duplicate detection & semantic clustering
│   │   └── slaService.js       # SLA deadline computation & escalation
│   ├── scripts/
│   │   └── setAdmin.js         # Administrator CLI credential updater
│   └── tests/
│       └── comprehensiveTestSuite.js # 20-Point automated test suite
│
└── client/                     # React.js (Vite) Frontend
    ├── index.html              # HTML shell
    ├── package.json            # Client dependencies & build scripts
    ├── vite.config.js          # Vite config & backend proxy
    └── src/
        ├── App.jsx             # Main router & state orchestrator
        ├── main.jsx            # React root mount
        └── components/
            ├── LandingPage.jsx         # Clean institutional public home page
            ├── LoginPage.jsx           # Secure split-card login & registration
            ├── Navbar.jsx              # Navigation tabs & user session
            ├── ComplaintForm.jsx       # Camera upload & issue reporting form
            ├── TicketCard.jsx          # Ticket card with "+1 Me Too" vote
            ├── TicketDetailModal.jsx   # 5-Step stepper, print slip & verification
            ├── CollegeDomainManager.jsx# Admin college domain whitelisting
            └── StudentDirectory.jsx    # HOD/Director student management
```

---

## 📜 License & Compliance

Distributed under the MIT License. Developed for research, academic infrastructure governance, and social innovation.
