import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Protected routes - require authentication
router.post('/create-intent', authMiddleware, paymentController.createPaymentIntent);
router.post('/confirm', authMiddleware, paymentController.confirmPayment);
router.get('/status/:paymentIntentId', authMiddleware, paymentController.getPaymentStatus);
router.get('/history', authMiddleware, paymentController.getPaymentHistory);

// Webhook - no auth needed (use Stripe signature verification in production)
router.post('/webhook', paymentController.handleWebhook);

export default router;
