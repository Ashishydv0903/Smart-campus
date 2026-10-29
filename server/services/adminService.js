const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Initializes or synchronizes the Platform Administrator account from backend environment variables.
 * Ensures the password in .env is securely hashed with bcrypt into MongoDB.
 */
async function syncAdminAccount() {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'ashish.admin@campus.edu').toLowerCase().trim();
    const adminPrn = (process.env.ADMIN_PRN || 'admin').trim();
    const adminName = (process.env.ADMIN_NAME || 'Ashish Yadav').trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@SecurePass2026';
    const adminDomain = (process.env.ADMIN_DOMAIN || 'campus.edu').trim();

    // Check if an admin user already exists by role, email, or prn
    let admin = await User.findOne({
      $or: [
        { email: adminEmail },
        { prn: adminPrn },
        { role: 'admin' }
      ]
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (!admin) {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        prn: adminPrn,
        password: hashedPassword,
        role: 'admin',
        institutionDomain: adminDomain,
        department: 'Platform Administration',
        campusZone: 'Main Administrative Block'
      });
      console.log(`[Admin Boot] Secure Administrator account created for '${adminEmail}' (PRN: '${adminPrn}').`);
    } else {
      // Synchronize latest credentials securely from .env
      admin.name = adminName;
      admin.email = adminEmail;
      admin.prn = adminPrn;
      admin.password = hashedPassword;
      admin.role = 'admin';
      admin.institutionDomain = adminDomain;
      await admin.save();
      console.log(`[Admin Boot] Secure Administrator credentials synced from .env for '${adminEmail}' (PRN: '${adminPrn}').`);
    }
  } catch (err) {
    console.error('[Admin Boot Error] Failed to sync admin account:', err.message);
  }
}

module.exports = { syncAdminAccount };
