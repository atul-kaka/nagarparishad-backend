/**
 * OTP Service for Mobile Authentication
 * Generates and validates OTP codes
 */

const pool = require('../config/database');

class OTPService {
  /**
   * Generate a random 6-digit OTP
   */
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to user's phone number
   * In production, integrate with SMS gateway (Twilio, AWS SNS, etc.)
   */
  static async sendOTP(phoneNumber, otp) {
    // TODO: Integrate with SMS gateway
    // For now, just log it (in production, use actual SMS service)
    console.log(`[OTP Service] Sending OTP ${otp} to ${phoneNumber}`);
    
    // Example with Twilio (uncomment and configure):
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: `Your OTP code is: ${otp}. Valid for 10 minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });
    
    return true;
  }

  /**
   * Generate and store OTP for a user
   */
  static async generateAndStoreOTP(userId, phoneNumber) {
    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes

    const query = `
      UPDATE users 
      SET otp_code = $1, 
          otp_expires_at = $2, 
          otp_verified = false
      WHERE id = $3
      RETURNING id, phone_no
    `;

    const result = await pool.query(query, [otp, expiresAt, userId]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    // Send OTP via SMS
    await this.sendOTP(phoneNumber, otp);

    return { otp, expiresAt };
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(userId, otpCode) {
    const query = `
      SELECT id, otp_code, otp_expires_at, otp_verified
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return { valid: false, error: 'User not found' };
    }

    const user = result.rows[0];

    if (user.otp_verified) {
      return { valid: false, error: 'OTP already used' };
    }

    if (!user.otp_code) {
      return { valid: false, error: 'No OTP generated' };
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return { valid: false, error: 'OTP expired' };
    }

    if (user.otp_code !== otpCode) {
      return { valid: false, error: 'Invalid OTP' };
    }

    // Mark OTP as verified
    await pool.query(
      'UPDATE users SET otp_verified = true WHERE id = $1',
      [userId]
    );

    return { valid: true };
  }

  /**
   * Clear OTP for a user
   */
  static async clearOTP(userId) {
    await pool.query(
      'UPDATE users SET otp_code = NULL, otp_expires_at = NULL, otp_verified = false WHERE id = $1',
      [userId]
    );
  }
}

module.exports = OTPService;



