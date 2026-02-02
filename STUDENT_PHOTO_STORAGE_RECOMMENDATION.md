# Student Photo Storage - Recommended Approach

## Overview

For storing student photos in the Nagar Parishad School Leaving Certificate System, we need a solution that ensures:
- **Future Validity**: Photos must be preserved for long-term record keeping
- **Security**: Access control and data protection
- **Scalability**: Handle growing number of student records
- **Performance**: Fast upload and retrieval
- **Audit Trail**: Track photo uploads/changes for compliance

---

## Recommended Approach: **Cloud Storage with Database Reference**

### Architecture

```
┌─────────────┐
│   Frontend  │ ──► Upload Photo
└─────────────┘
       │
       ▼
┌─────────────┐
│   Backend   │ ──► Validate & Process
│   (Express) │
└─────────────┘
       │
       ├──► Store in Cloud Storage (Azure Blob / AWS S3)
       │
       └──► Save Reference in PostgreSQL
            (photo_url, photo_path, upload_date, etc.)
```

### Why This Approach?

✅ **Scalability**: Cloud storage scales automatically  
✅ **Reliability**: 99.9%+ uptime with redundancy  
✅ **Cost-Effective**: Pay only for storage used  
✅ **Security**: Built-in encryption and access controls  
✅ **Backup**: Automatic backups and versioning  
✅ **Performance**: CDN integration for fast delivery  
✅ **Compliance**: Meets government record-keeping requirements  

---

## Implementation Options

### Option 1: Azure Blob Storage (Recommended for Azure Deployments)

**Best for**: If you're already using Azure infrastructure

**Pros:**
- Native Azure integration
- Cost-effective for government use
- Built-in redundancy (LRS, GRS, ZRS)
- Lifecycle management policies
- Azure AD integration for security

**Cons:**
- Azure-specific (vendor lock-in)
- Requires Azure account setup

**Cost Estimate:**
- Storage: ~$0.0184/GB/month (Hot tier)
- Transactions: ~$0.004 per 10,000 operations
- For 10,000 students (avg 200KB photo): ~2GB = $0.04/month

---

### Option 2: AWS S3 (Recommended for AWS/Multi-Cloud)

**Best for**: Maximum flexibility and industry standard

**Pros:**
- Industry standard, widely supported
- Excellent documentation and tooling
- Multiple storage classes (Standard, Glacier for archives)
- Lifecycle policies for cost optimization
- Strong security features (IAM, encryption)

**Cons:**
- Slightly more complex setup
- Pricing can be complex

**Cost Estimate:**
- Storage: ~$0.023/GB/month (Standard)
- Requests: ~$0.005 per 1,000 PUT requests
- For 10,000 students: ~2GB = $0.05/month

---

### Option 3: Local File System (Not Recommended for Production)

**Best for**: Development/testing only

**Pros:**
- Simple setup
- No external dependencies
- No additional costs

**Cons:**
- ❌ No automatic backups
- ❌ Limited scalability
- ❌ Server disk space constraints
- ❌ Single point of failure
- ❌ Difficult to maintain for long-term validity

**Use Case**: Only for development/testing environments

---

## Recommended Implementation: Azure Blob Storage

### Step 1: Database Schema Changes

Add photo-related columns to `students` table:

```sql
-- Migration: Add student photo storage fields
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_path VARCHAR(500),
  ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS photo_uploaded_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS photo_hash VARCHAR(64), -- SHA-256 hash for integrity verification
  ADD COLUMN IF NOT EXISTS photo_size INTEGER, -- Size in bytes
  ADD COLUMN IF NOT EXISTS photo_mime_type VARCHAR(50); -- image/jpeg, image/png, etc.

-- Index for photo queries
CREATE INDEX IF NOT EXISTS idx_students_photo_url ON students(photo_url) WHERE photo_url IS NOT NULL;
```

### Step 2: Install Required Packages

```bash
npm install @azure/storage-blob multer sharp
```

- `@azure/storage-blob`: Azure Blob Storage SDK
- `multer`: File upload middleware
- `sharp`: Image processing (resize, optimize, validate)

### Step 3: File Structure

```
nagarparishad-backend/
├── config/
│   └── azureStorage.js          # Azure Blob Storage configuration
├── middleware/
│   └── upload.js                 # Multer configuration for photo uploads
├── services/
│   └── photoService.js           # Photo upload/retrieval service
├── routes/
│   └── students-photos.js        # Photo upload/download endpoints
└── utils/
    └── imageProcessor.js         # Image validation and processing
```

### Step 4: Implementation Details

#### 4.1 Azure Storage Configuration

```javascript
// config/azureStorage.js
const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'student-photos';

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Ensure container exists
async function ensureContainer() {
  const exists = await containerClient.exists();
  if (!exists) {
    await containerClient.create({
      access: 'private', // Private access - requires authentication
    });
    console.log(`Container "${containerName}" created`);
  }
}

module.exports = {
  blobServiceClient,
  containerClient,
  containerName,
  ensureContainer
};
```

#### 4.2 Photo Upload Service

```javascript
// services/photoService.js
const { containerClient } = require('../config/azureStorage');
const crypto = require('crypto');
const sharp = require('sharp');

class PhotoService {
  /**
   * Upload student photo to Azure Blob Storage
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {Number} studentId - Student ID
   * @param {String} mimeType - Image MIME type
   * @returns {Object} Photo metadata
   */
  static async uploadPhoto(imageBuffer, studentId, mimeType) {
    // Validate and process image
    const processedImage = await this.processImage(imageBuffer);
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `student-${studentId}-${timestamp}.jpg`;
    const blobPath = `photos/${new Date().getFullYear()}/${filename}`;
    
    // Calculate hash for integrity verification
    const hash = crypto.createHash('sha256').update(processedImage).digest('hex');
    
    // Upload to Azure Blob Storage
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.upload(processedImage, processedImage.length, {
      blobHTTPHeaders: {
        blobContentType: 'image/jpeg',
        blobContentDisposition: `inline; filename="${filename}"`
      },
      metadata: {
        studentId: studentId.toString(),
        uploadedAt: new Date().toISOString(),
        hash: hash
      }
    });
    
    // Get the URL (you may want to use SAS token for private access)
    const photoUrl = blockBlobClient.url;
    
    return {
      photo_url: photoUrl,
      photo_path: blobPath,
      photo_hash: hash,
      photo_size: processedImage.length,
      photo_mime_type: 'image/jpeg'
    };
  }
  
  /**
   * Process and validate image
   * @param {Buffer} imageBuffer - Raw image buffer
   * @returns {Buffer} Processed image buffer
   */
  static async processImage(imageBuffer) {
    // Validate image
    const metadata = await sharp(imageBuffer).metadata();
    
    // Check dimensions (max 2000x2000, min 200x200)
    if (metadata.width > 2000 || metadata.height > 2000) {
      throw new Error('Image dimensions too large. Maximum 2000x2000 pixels.');
    }
    if (metadata.width < 200 || metadata.height < 200) {
      throw new Error('Image dimensions too small. Minimum 200x200 pixels.');
    }
    
    // Resize to standard size (800x800) and convert to JPEG
    const processed = await sharp(imageBuffer)
      .resize(800, 800, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    return processed;
  }
  
  /**
   * Delete photo from Azure Blob Storage
   * @param {String} blobPath - Path to blob
   */
  static async deletePhoto(blobPath) {
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.delete();
  }
  
  /**
   * Generate SAS token for temporary access (if needed)
   * @param {String} blobPath - Path to blob
   * @param {Number} expiryMinutes - Token expiry in minutes
   * @returns {String} SAS URL
   */
  static async generateSasUrl(blobPath, expiryMinutes = 60) {
    // Implementation for SAS token generation
    // This allows temporary access to private blobs
  }
}
```

#### 4.3 Upload Middleware

```javascript
// middleware/upload.js
const multer = require('multer');
const { authenticate } = require('./auth');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter
});

module.exports = upload;
```

#### 4.4 Photo Upload Route

```javascript
// routes/students-photos.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const { canEditDocument } = require('../middleware/rbac');
const PhotoService = require('../services/photoService');
const Student = require('../models/Student');
const pool = require('../config/database');

/**
 * @swagger
 * /api/students/{id}/photo:
 *   post:
 *     summary: Upload student photo
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 *       400:
 *         description: Invalid file or student not found
 */
router.post(
  '/:id/photo',
  authenticate,
  canEditDocument,
  upload.single('photo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No photo file provided'
        });
      }
      
      const studentId = req.params.id;
      
      // Verify student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }
      
      // Upload photo to Azure Blob Storage
      const photoData = await PhotoService.uploadPhoto(
        req.file.buffer,
        studentId,
        req.file.mimetype
      );
      
      // Update student record with photo information
      const updateQuery = `
        UPDATE students 
        SET 
          photo_url = $1,
          photo_path = $2,
          photo_hash = $3,
          photo_size = $4,
          photo_mime_type = $5,
          photo_uploaded_at = CURRENT_TIMESTAMP,
          photo_uploaded_by = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, photo_url, photo_uploaded_at
      `;
      
      const result = await pool.query(updateQuery, [
        photoData.photo_url,
        photoData.photo_path,
        photoData.photo_hash,
        photoData.photo_size,
        photoData.photo_mime_type,
        req.user.id,
        studentId
      ]);
      
      res.json({
        success: true,
        message: 'Photo uploaded successfully',
        data: {
          student_id: result.rows[0].id,
          photo_url: result.rows[0].photo_url,
          uploaded_at: result.rows[0].photo_uploaded_at
        }
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload photo'
      });
    }
  }
);

/**
 * @swagger
 * /api/students/{id}/photo:
 *   get:
 *     summary: Get student photo URL
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Photo URL retrieved
 *       404:
 *         description: Student or photo not found
 */
router.get('/:id/photo', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    if (!student.photo_url) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found for this student'
      });
    }
    
    // Generate temporary access URL (SAS token) if needed
    // Or return public URL if container is public
    res.json({
      success: true,
      data: {
        photo_url: student.photo_url,
        uploaded_at: student.photo_uploaded_at,
        photo_size: student.photo_size
      }
    });
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch photo'
    });
  }
});

/**
 * @swagger
 * /api/students/{id}/photo:
 *   delete:
 *     summary: Delete student photo
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 */
router.delete(
  '/:id/photo',
  authenticate,
  canEditDocument,
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.id);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }
      
      if (!student.photo_path) {
        return res.status(404).json({
          success: false,
          error: 'No photo to delete'
        });
      }
      
      // Delete from Azure Blob Storage
      await PhotoService.deletePhoto(student.photo_path);
      
      // Update database
      await pool.query(
        `UPDATE students 
         SET photo_url = NULL, photo_path = NULL, photo_hash = NULL,
             photo_size = NULL, photo_mime_type = NULL,
             photo_uploaded_at = NULL, photo_uploaded_by = NULL
         WHERE id = $1`,
        [req.params.id]
      );
      
      res.json({
        success: true,
        message: 'Photo deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete photo'
      });
    }
  }
);

module.exports = router;
```

### Step 5: Environment Variables

Add to `.env`:

```env
# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your_account;AccountKey=your_key;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER=student-photos
```

### Step 6: Update Server.js

```javascript
// Add photo routes
app.use('/api/students', require('./routes/students-photos'));

// Initialize Azure container on startup
const { ensureContainer } = require('./config/azureStorage');
ensureContainer().catch(console.error);
```

---

## Security Considerations

### 1. Access Control
- Use **private containers** in Azure Blob Storage
- Generate **SAS tokens** for temporary access when needed
- Implement **RBAC** checks before photo upload/delete

### 2. Image Validation
- Validate file type (only JPEG, PNG)
- Check file size (max 5MB)
- Validate dimensions (min 200x200, max 2000x2000)
- Scan for malicious content (optional: use virus scanning)

### 3. Data Integrity
- Store SHA-256 hash of image
- Verify hash on retrieval
- Enable versioning in Azure Blob Storage

### 4. Compliance
- Encrypt data at rest (Azure Blob Storage default)
- Encrypt data in transit (HTTPS)
- Maintain audit logs of photo uploads/deletions
- Implement data retention policies

---

## Backup and Disaster Recovery

### Azure Blob Storage Features:
1. **Geo-Redundant Storage (GRS)**: Automatic replication to secondary region
2. **Versioning**: Keep multiple versions of files
3. **Soft Delete**: Recover deleted blobs within retention period
4. **Point-in-Time Restore**: Restore to specific time

### Recommended Backup Strategy:
- Enable **GRS** for production
- Enable **versioning** for critical photos
- Set **soft delete** retention to 30 days
- Regular **export** to cold storage (Archive tier) for long-term retention

---

## Cost Optimization

### Storage Tiers:
1. **Hot Tier**: Frequently accessed photos (current students)
2. **Cool Tier**: Less frequently accessed (graduated students)
3. **Archive Tier**: Rarely accessed (historical records)

### Lifecycle Management Policy:
```json
{
  "rules": [
    {
      "name": "MoveOldPhotosToCool",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["photos/"]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 365
            }
          }
        }
      }
    }
  ]
}
```

---

## Alternative: AWS S3 Implementation

If you prefer AWS S3, the implementation is similar:

```javascript
// config/s3Storage.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const bucketName = process.env.AWS_S3_BUCKET || 'student-photos';

module.exports = { s3, bucketName };
```

---

## Migration Path

### Phase 1: Setup (Week 1)
1. Create Azure Storage Account
2. Create container for student photos
3. Add database columns
4. Install dependencies

### Phase 2: Implementation (Week 2)
1. Implement photo upload service
2. Create API endpoints
3. Add validation and security
4. Write tests

### Phase 3: Deployment (Week 3)
1. Deploy to staging
2. Test with sample photos
3. Deploy to production
4. Monitor and optimize

---

## Testing Checklist

- [ ] Upload valid photo (JPEG, PNG)
- [ ] Reject invalid file types
- [ ] Reject oversized files (>5MB)
- [ ] Reject images with invalid dimensions
- [ ] Verify photo URL is stored in database
- [ ] Test photo retrieval
- [ ] Test photo deletion
- [ ] Verify RBAC permissions
- [ ] Test concurrent uploads
- [ ] Verify hash integrity
- [ ] Test error handling

---

## Monitoring and Maintenance

### Key Metrics to Monitor:
- Storage usage (GB)
- Upload success rate
- Average upload time
- Error rates
- Access patterns

### Maintenance Tasks:
- Monthly: Review storage costs
- Quarterly: Audit photo access logs
- Annually: Review and update retention policies

---

## Conclusion

**Recommended Solution**: Azure Blob Storage with database reference

This approach provides:
- ✅ Long-term validity and preservation
- ✅ Scalability for growing student records
- ✅ Security and compliance
- ✅ Cost-effectiveness
- ✅ Easy integration with existing system

**Next Steps**:
1. Review and approve this approach
2. Set up Azure Storage Account
3. Implement the code changes
4. Test thoroughly
5. Deploy to production

---

## Questions or Concerns?

If you have questions about:
- Cost estimates for your specific volume
- Alternative storage providers
- Security requirements
- Integration with existing workflows

Please discuss with the development team.

