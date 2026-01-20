# OTP Authentication Guide

## Overview

The system supports mobile-based OTP (One-Time Password) authentication. Currently, OTPs are logged to the console for development. For production, you need to integrate with an SMS gateway.

---

## How to Get OTP

### Current Implementation (Development)

**OTPs are logged to the server console** - Check your Node.js server logs where the application is running.

### Step 1: Request OTP

Send a POST request to request an OTP:

```bash
curl -X POST http://api.kaamlo.com/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone_no": "+919876543210"}'
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your phone number"
}
```

### Step 2: Check Server Console

The OTP will be printed in your server console:

```
[OTP Service] Sending OTP 123456 to +919876543210
```

**Example:**
```
[OTP Service] Sending OTP 456789 to +919876543210
```

### Step 3: Verify OTP

Use the OTP from the console to verify:

```bash
curl -X POST http://api.kaamlo.com/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone_no": "+919876543210",
    "otp": "123456"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "user123",
      "phone_no": "+919876543210",
      "role": "user"
    }
  }
}
```

---

## Production Setup: SMS Integration

For production, you need to integrate with an SMS gateway. Here are options:

### Option 1: Twilio (Recommended)

#### Step 1: Install Twilio

```bash
npm install twilio
```

#### Step 2: Get Twilio Credentials

1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token
3. Get a Twilio phone number

#### Step 3: Update `.env`

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Step 4: Update `services/otpService.js`

Uncomment and configure the Twilio code:

```javascript
static async sendOTP(phoneNumber, otp) {
  const twilio = require('twilio');
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID, 
    process.env.TWILIO_AUTH_TOKEN
  );
  
  await client.messages.create({
    body: `Your OTP code is: ${otp}. Valid for 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  });
  
  return true;
}
```

---

### Option 2: AWS SNS

#### Step 1: Install AWS SDK

```bash
npm install @aws-sdk/client-sns
```

#### Step 2: Update `.env`

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

#### Step 3: Update `services/otpService.js`

```javascript
static async sendOTP(phoneNumber, otp) {
  const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
  
  const snsClient = new SNSClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
  
  await snsClient.send(new PublishCommand({
    PhoneNumber: phoneNumber,
    Message: `Your OTP code is: ${otp}. Valid for 10 minutes.`
  }));
  
  return true;
}
```

---

### Option 3: Indian SMS Gateways

For Indian phone numbers, consider:

1. **MSG91** - https://msg91.com
2. **TextLocal** - https://www.textlocal.in
3. **Fast2SMS** - https://www.fast2sms.com

#### Example: MSG91 Integration

```bash
npm install axios
```

```javascript
static async sendOTP(phoneNumber, otp) {
  const axios = require('axios');
  
  await axios.post('https://api.msg91.com/api/v5/otp', {
    template_id: process.env.MSG91_TEMPLATE_ID,
    mobile: phoneNumber.replace(/^\+91/, ''), // Remove country code
    otp: otp
  }, {
    headers: {
      'authkey': process.env.MSG91_AUTH_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  return true;
}
```

---

## API Endpoints

### 1. Request OTP

**POST** `/api/auth/otp/request`

**Request:**
```json
{
  "phone_no": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your phone number"
}
```

---

### 2. Verify OTP

**POST** `/api/auth/otp/verify`

**Request:**
```json
{
  "phone_no": "+919876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "user123",
      "phone_no": "+919876543210",
      "role": "user"
    }
  }
}
```

---

## OTP Details

- **Length**: 6 digits
- **Validity**: 10 minutes
- **Format**: Numeric (e.g., `123456`)
- **Single Use**: Each OTP can only be used once
- **Auto-Expiry**: Expires after 10 minutes

---

## Development Workflow

### 1. Start Server

```bash
npm start
# or
npm run dev
```

### 2. Request OTP

```bash
curl -X POST http://localhost:3000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone_no": "+919876543210"}'
```

### 3. Check Console

Look for:
```
[OTP Service] Sending OTP 123456 to +919876543210
```

### 4. Verify OTP

```bash
curl -X POST http://localhost:3000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone_no": "+919876543210",
    "otp": "123456"
  }'
```

---

## Troubleshooting

### OTP Not Received

1. **Check Server Console** - OTP is logged there in development
2. **Check Phone Number Format** - Use international format: `+919876543210`
3. **Check User Exists** - User must be registered with that phone number
4. **Check Account Status** - User account must be active

### OTP Expired

- OTPs expire after 10 minutes
- Request a new OTP if expired

### Invalid OTP

- Ensure you're using the correct 6-digit code
- Check for typos
- Verify the OTP hasn't been used already

### User Not Found

- Ensure the phone number is registered in the system
- Check the phone number format matches exactly

---

## Security Notes

1. **Rate Limiting**: Consider adding rate limiting to prevent OTP spam
2. **OTP Storage**: OTPs are stored in the database temporarily
3. **Expiration**: OTPs automatically expire after 10 minutes
4. **Single Use**: Each OTP can only be verified once
5. **Phone Verification**: Ensure phone numbers are verified during registration

---

## Frontend Integration Example

```javascript
// Request OTP
async function requestOTP(phoneNumber) {
  const response = await fetch('http://api.kaamlo.com/api/auth/otp/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_no: phoneNumber })
  });
  return await response.json();
}

// Verify OTP
async function verifyOTP(phoneNumber, otpCode) {
  const response = await fetch('http://api.kaamlo.com/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_no: phoneNumber,
      otp: otpCode
    })
  });
  return await response.json();
}

// Usage
const phoneNumber = '+919876543210';

// Step 1: Request OTP
const requestResult = await requestOTP(phoneNumber);
if (requestResult.success) {
  // Step 2: User enters OTP from SMS
  const otpCode = prompt('Enter OTP sent to your phone:');
  
  // Step 3: Verify OTP
  const verifyResult = await verifyOTP(phoneNumber, otpCode);
  if (verifyResult.success) {
    // Store token
    localStorage.setItem('token', verifyResult.data.token);
    console.log('Login successful!');
  }
}
```

---

**Last Updated:** 2024

