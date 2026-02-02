/**
 * Script to create a test user for authentication
 * Run: node scripts/create-test-user.js
 */

require('dotenv').config();
const User = require('../models/User');
const pool = require('../config/database');

async function createTestUser() {
  try {
    console.log('Creating test users...\n');

    // Check if users already exist
    const existingUsers = await User.findAll();
    console.log(`Found ${existingUsers.length} existing users\n`);

    // Create Super Admin
    try {
      const superAdmin = await User.create({
        username: 'superadmin',
        email: 'super@example.com',
        password: 'admin123',
        full_name: 'Super Admin',
        role: 'super',
        phone_no: '9561069363'
      });
      console.log('✅ Super Admin created:');
      console.log(`   Username: ${superAdmin.username}`);
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Role: ${superAdmin.role}\n`);
    } catch (error) {
      if (error.code === '23505') {
        console.log('⚠️  Super Admin already exists\n');
      } else {
        throw error;
      }
    }

    // Create Admin
    try {
      const admin = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        full_name: 'Admin User',
        role: 'admin',
        phone_no: '1234567891'
      });
      console.log('✅ Admin created:');
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}\n`);
    } catch (error) {
      if (error.code === '23505') {
        console.log('⚠️  Admin already exists\n');
      } else {
        throw error;
      }
    }

    // Create Regular User
    try {
      const user = await User.create({
        username: 'user',
        email: 'user@example.com',
        password: 'user123',
        full_name: 'Regular User',
        role: 'user',
        phone_no: '1234567892'
      });
      console.log('✅ Regular User created:');
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}\n`);
    } catch (error) {
      if (error.code === '23505') {
        console.log('⚠️  Regular User already exists\n');
      } else {
        throw error;
      }
    }

    console.log('\n📝 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Super Admin:');
    console.log('  Username: superadmin');
    console.log('  Password: admin123');
    console.log('\nAdmin:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\nUser:');
    console.log('  Username: user');
    console.log('  Password: user123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  }
}

createTestUser();




