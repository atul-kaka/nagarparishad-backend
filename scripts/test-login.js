/**
 * Script to test login functionality
 * Run: node scripts/test-login.js [username] [password]
 */

require('dotenv').config();
const User = require('../models/User');

async function testLogin(username, password) {
  try {
    console.log(`Testing login for: ${username}\n`);

    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.is_active}`);
    console.log(`   Has password_hash: ${!!user.password_hash}`);

    if (user.locked_until) {
      console.log(`   Locked until: ${user.locked_until}`);
    }

    if (user.failed_login_attempts) {
      console.log(`   Failed attempts: ${user.failed_login_attempts}`);
    }

    // Test password
    if (password) {
      console.log('\n🔐 Testing password...');
      const isValid = await User.verifyPassword(password, user.password_hash);
      if (isValid) {
        console.log('✅ Password is correct!');
      } else {
        console.log('❌ Password is incorrect!');
      }
    } else {
      console.log('\n⚠️  No password provided for testing');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const username = process.argv[2] || 'admin';
const password = process.argv[3] || null;

testLogin(username, password);

