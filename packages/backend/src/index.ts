import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API endpoints
app.get('/api/products', (req, res) => {
  res.json({ message: 'Products endpoint - TODO' });
});

app.get('/api/farmers', (req, res) => {
  res.json({ message: 'Farmers endpoint - TODO' });
});

app.get('/api/buyers', (req, res) => {
  res.json({ message: 'Buyers endpoint - TODO' });
});

app.get('/api/orders', (req, res) => {
  res.json({ message: 'Orders endpoint - TODO' });
});

app.listen(PORT, () => {
  console.log(`🚀 eTunda Backend running on port ${PORT}`);
});

export default app;
