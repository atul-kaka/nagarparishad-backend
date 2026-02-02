/**
 * Password Reset Service
 * Handles password reset token generation and validation
 */

const crypto = require('crypto');
const pool = require('../config/database');
const bcrypt = require('bcrypt');

class PasswordResetService {
  /**
   * Generate a secure random token
   */
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create password reset token for user
   */
  static async createResetToken(userId) {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour

    await pool.query(
      `UPDATE users 
       SET reset_token = $1, 
           reset_token_expires_at = $2
       WHERE id = $3`,
      [token, expiresAt, userId]
    );

    return { token, expiresAt };
  }

  /**
   * Verify reset token
   */
  static async verifyResetToken(token) {
    const result = await pool.query(
      `SELECT id, username, email, reset_token_expires_at
       FROM users
       WHERE reset_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return { valid: false, error: 'Invalid reset token' };
    }

    const user = result.rows[0];

    if (new Date() > new Date(user.reset_token_expires_at)) {
      return { valid: false, error: 'Reset token has expired' };
    }

    return { valid: true, user };
  }

  /**
   * Reset password using token
   */
  static async resetPassword(token, newPassword) {
    const verification = await this.verifyResetToken(token);
    
    if (!verification.valid) {
      return { success: false, error: verification.error };
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await pool.query(
      `UPDATE users 
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expires_at = NULL,
           password_changed_at = CURRENT_TIMESTAMP,
           failed_login_attempts = 0,
           locked_until = NULL
       WHERE id = $2`,
      [passwordHash, verification.user.id]
    );

    return { success: true, userId: verification.user.id };
  }

  /**
   * Clear reset token
   */
  static async clearResetToken(userId) {
    await pool.query(
      'UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = $1',
      [userId]
    );
  }

  /**
   * Send password reset email (placeholder - integrate with email service)
   */
  static async sendResetEmail(email, token, username) {
    // TODO: Integrate with email service (Nodemailer, SendGrid, etc.)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    console.log(`[Password Reset] Email to ${email}:`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Token: ${token}`);
    
    // Example with Nodemailer (uncomment and configure):
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: process.env.SMTP_PORT,
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS
    //   }
    // });
    // 
    // await transporter.sendMail({
    //   from: process.env.SMTP_FROM,
    //   to: email,
    //   subject: 'Password Reset Request',
    //   html: `
    //     <h2>Password Reset Request</h2>
    //     <p>Hello ${username},</p>
    //     <p>You requested to reset your password. Click the link below to reset it:</p>
    //     <p><a href="${resetUrl}">${resetUrl}</a></p>
    //     <p>This link will expire in 1 hour.</p>
    //     <p>If you didn't request this, please ignore this email.</p>
    //   `
    // });
    
    return true;
  }
}

module.exports = PasswordResetService;




