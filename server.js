const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const app = express();

// Middleware
// CORS configuration - allow your domain and localhost for development
const allowedOrigins = [
  'https://api.kaamlo.com',
  'https://kaamlo.com',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow any localhost
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Nagar Parishad API Documentation'
}));

// Routes
app.use('/api/schools', require('./routes/schools'));
app.use('/api/students', require('./routes/students'));
app.use('/api/students', require('./routes/students-consolidated'));
app.use('/api/students', require('./routes/students-status'));
// Authentication routes (no auth required)
app.use('/api/auth', require('./routes/auth'));

// Certificate routes with RBAC
app.use('/api/certificates', require('./routes/certificates-rbac'));
// Keep old routes for backward compatibility (will be deprecated)
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/certificates', require('./routes/certificates-status'));
app.use('/api/certificates', require('./routes/certificates-bulk'));
app.use('/api/users', require('./routes/users'));
app.use('/api/audit', require('./routes/audit'));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Nagar Parishad Backend Service is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Nagar Parishad Backend Service is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 endpoints:
 *                   type: object
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Nagar Parishad School Leaving Certificate API',
    version: '1.0.0',
    endpoints: {
      schools: '/api/schools',
      students: '/api/students',
      certificates: '/api/certificates',
      users: '/api/users',
      audit: '/api/audit',
      health: '/health',
      api_docs: '/api-docs'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Display network information
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  console.log('\n=== Network Access Information ===');
  console.log('Local access: http://localhost:' + PORT);
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`Network access: http://${iface.address}:${PORT}`);
      }
    });
  });
  console.log('===================================\n');
});

