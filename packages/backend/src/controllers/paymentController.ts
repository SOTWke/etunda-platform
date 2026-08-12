import { Request, Response } from 'express';
import * as paymentService from '../services/paymentService';

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { amount, orderId, currency = 'USD' } = req.body;

    if (!userId || !amount || !orderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const paymentIntent = await paymentService.createPaymentIntent({
      orderId,
      amount,
      currency,
      userId,
    });

    res.status(201).json(paymentIntent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId || !paymentMethodId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await paymentService.confirmPayment(
      paymentIntentId,
      paymentMethodId
    );

    if (result.success) {
      res.json({ success: true, paymentIntentId, status: result.status });
    } else {
      res.status(400).json({ error: 'Payment confirmation failed' });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    const status = await paymentService.getPaymentStatus(paymentIntentId);
    res.json(status);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body;
    await paymentService.handleStripeWebhook(event);
    res.json({ received: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const history = await paymentService.getPaymentHistory(userId);
    res.json({ data: history });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
