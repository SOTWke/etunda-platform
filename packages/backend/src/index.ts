import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { initializeDatabase } from './models';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import farmerRoutes from './routes/farmerRoutes';
import buyerRoutes from './routes/buyerRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Initialize and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Initialize payments table if Stripe is configured
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const { initializePaymentsTable } = await import('./services/paymentService');
        await initializePaymentsTable();
        console.log('✅ Payments table initialized');
      } catch (error) {
        console.log('⚠️  Payments not configured');
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 eTunda Backend running on port ${PORT}`);
      console.log(`📍 Health: http://localhost:${PORT}/health`);
      console.log(`💳 Payments: http://localhost:${PORT}/api/payments`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
