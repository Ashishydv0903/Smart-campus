const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_campus_db';

async function setAdminCredentials() {
  const args = process.argv.slice(2);
  const emailInput = args[0] || process.env.ADMIN_EMAIL || 'ashish.admin@campus.edu';
  const passwordInput = args[1] || process.env.ADMIN_PASSWORD || 'Admin@SecurePass2026';
  const nameInput = args[2] || process.env.ADMIN_NAME || 'Ashish Yadav';
  const prnInput = args[3] || process.env.ADMIN_PRN || 'admin';

  console.log(`\n--- [Smart Campus] Updating Administrator Credentials ---`);
  console.log(`Admin Name:     ${nameInput}`);
  console.log(`Admin Email:    ${emailInput}`);
  console.log(`Admin PRN / ID: ${prnInput}`);
  console.log(`Password:       [Protected & Encrypted]`);

  try {
    await mongoose.connect(MONGO_URI);
    const hashedPassword = await bcrypt.hash(passwordInput, 10);

    let admin = await User.findOne({
      $or: [
        { email: emailInput.toLowerCase() },
        { prn: prnInput },
        { role: 'admin' }
      ]
    });

    if (!admin) {
      admin = await User.create({
        name: nameInput,
        email: emailInput.toLowerCase(),
        prn: prnInput,
        password: hashedPassword,
        role: 'admin',
        institutionDomain: 'campus.edu',
        department: 'Platform Administration',
        campusZone: 'Main Administrative Block'
      });
      console.log(`\n✓ New Platform Administrator account created successfully!`);
    } else {
      admin.name = nameInput;
      admin.email = emailInput.toLowerCase();
      admin.prn = prnInput;
      admin.password = hashedPassword;
      admin.role = 'admin';
      await admin.save();
      console.log(`\n✓ Existing Administrator account updated and securely hashed!`);
    }

    // Update .env file for persistence
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const updates = {
      ADMIN_NAME: nameInput,
      ADMIN_EMAIL: emailInput,
      ADMIN_PRN: prnInput,
      ADMIN_PASSWORD: passwordInput
    };

    let updatedEnv = envContent;
    for (const [key, val] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(updatedEnv)) {
        updatedEnv = updatedEnv.replace(regex, `${key}=${val}`);
      } else {
        updatedEnv += `\n${key}=${val}`;
      }
    }

    fs.writeFileSync(envPath, updatedEnv.trim() + '\n');
    console.log(`✓ Synchronized with backend .env configuration.`);
    console.log(`\nYou can now log in securely using your configured credentials.\n`);
  } catch (err) {
    console.error('Error setting admin credentials:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

setAdminCredentials();
