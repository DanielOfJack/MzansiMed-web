const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const patientRoutes = require('./routes/patients');
const medicationRoutes = require('./routes/medications');
const translationRoutes = require('./routes/translations');
const medicationOptionsRoutes = require('./routes/medicationOptions');
const pharmacistRoutes = require('./routes/pharmacists');
const { createTables } = require('./scripts/setupDatabase');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/medication-options', medicationOptionsRoutes);
app.use('/api/pharmacists', pharmacistRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'MzansiMed API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Ensure database tables exist
    await createTables();
    
    app.listen(PORT, () => {
      console.log(`🚀 MzansiMed API server running on port ${PORT}`);
      console.log(`🏥 Health check available at http://localhost:${PORT}/api/health`);
      console.log(`👥 Patients API available at http://localhost:${PORT}/api/patients`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();
