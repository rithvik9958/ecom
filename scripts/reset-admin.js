/**
 * One-time admin password reset script.
 * Run: node scripts/reset-admin.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://rithvikrautela_db_user:Q7bLE5vfFhjWuJ86@ac-tbywzxp-shard-00-00.lavrnrt.mongodb.net:27017,ac-tbywzxp-shard-00-01.lavrnrt.mongodb.net:27017,ac-tbywzxp-shard-00-02.lavrnrt.mongodb.net:27017/ecom-store?ssl=true&replicaSet=atlas-qwl6le-shard-0&authSource=admin';

const NEW_PASSWORD = 'Admin@1234'; // ← Change this to your desired password

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  // Find all admin users
  const allUsers = await users.find({}).toArray();
  
  if (allUsers.length === 0) {
    console.log('❌ No users found in database.');
    process.exit(1);
  }

  console.log('\n📋 Found users:');
  allUsers.forEach((u, i) => {
    console.log(`  ${i + 1}. Email: ${u.email} | Role: ${u.role} | Active: ${u.isActive}`);
  });

  // Reset password for the first super_admin (or first user)
  const admin = allUsers.find(u => u.role === 'super_admin') || allUsers[0];
  
  const hashed = await bcrypt.hash(NEW_PASSWORD, 12);
  await users.updateOne(
    { _id: admin._id },
    { $set: { password: hashed, failedLoginAttempts: 0, isLocked: false, lockUntil: null, isActive: true } }
  );

  console.log(`\n✅ Password reset for: ${admin.email}`);
  console.log(`   New password: ${NEW_PASSWORD}`);
  console.log(`   Role: ${admin.role}`);
  console.log('\n🔑 You can now log in at http://localhost:3000/login\n');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
