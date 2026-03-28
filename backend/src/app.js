const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const clientRoutes = require('./routes/clientRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/clients', clientRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'HST API is running' }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use(errorHandler);

module.exports = app;
