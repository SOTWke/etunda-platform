import Stripe from 'stripe';
import { query } from '../config/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

interface PaymentData {
  orderId: string;
  amount: number;
  currency: string;
  userId: string;
}

interface PaymentRecord {
  id: string;
  order_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: Date;
}

/**
 * Create database table for payments
 */
export const initializePaymentsTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id),
        stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)
    `);

    console.log('✅ Payments table initialized');
  } catch (error) {
    console.error('Failed to initialize payments table:', error);
  }
};

/**
 * Create a Stripe payment intent
 */
export const createPaymentIntent = async (paymentData: PaymentData) => {
  try {
    const intent = await stripe.paymentIntents.create({
      amount: paymentData.amount, // Already in cents
      currency: paymentData.currency.toLowerCase(),
      metadata: {
        orderId: paymentData.orderId,
        userId: paymentData.userId,
      },
      description: `eTunda Order: ${paymentData.orderId}`,
    });

    // Store payment record in database
    await query(
      `INSERT INTO payments (order_id, stripe_payment_intent_id, amount, currency, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [paymentData.orderId, intent.id, paymentData.amount / 100, paymentData.currency]
    );

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: paymentData.amount / 100,
      currency: paymentData.currency,
    };
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    throw error;
  }
};

/**
 * Confirm payment with Stripe
 */
export const confirmPayment = async (
  paymentIntentId: string,
  paymentMethodId: string
) => {
  try {
    const intent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    // Update payment status in database
    await query(
      `UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE stripe_payment_intent_id = $2`,
      [intent.status, paymentIntentId]
    );

    // If payment succeeded, update order status
    if (intent.status === 'succeeded') {
      const result = await query(
        `SELECT order_id FROM payments WHERE stripe_payment_intent_id = $1`,
        [paymentIntentId]
      );

      if (result.rows[0]) {
        await query(
          `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          ['confirmed', result.rows[0].order_id]
        );
      }
    }

    return {
      success: intent.status === 'succeeded',
      status: intent.status,
      paymentIntentId: intent.id,
    };
  } catch (error) {
    console.error('Failed to confirm payment:', error);
    throw error;
  }
};

/**
 * Get payment status
 */
export const getPaymentStatus = async (paymentIntentId: string) => {
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Update database status
    await query(
      `UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE stripe_payment_intent_id = $2`,
      [intent.status, paymentIntentId]
    );

    return {
      status: intent.status,
      amount: intent.amount / 100,
      currency: intent.currency,
      paymentIntentId: intent.id,
    };
  } catch (error) {
    console.error('Failed to get payment status:', error);
    throw error;
  }
};

/**
 * Handle Stripe webhook
 */
export const handleStripeWebhook = async (event: any) => {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const succeededIntent = event.data.object;
        await query(
          `UPDATE payments SET status = 'succeeded', updated_at = CURRENT_TIMESTAMP
           WHERE stripe_payment_intent_id = $1`,
          [succeededIntent.id]
        );
        console.log(`✅ Payment succeeded: ${succeededIntent.id}`);
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        await query(
          `UPDATE payments SET status = 'failed', updated_at = CURRENT_TIMESTAMP
           WHERE stripe_payment_intent_id = $1`,
          [failedIntent.id]
        );
        console.log(`❌ Payment failed: ${failedIntent.id}`);
        break;

      case 'payment_intent.canceled':
        const canceledIntent = event.data.object;
        await query(
          `UPDATE payments SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
           WHERE stripe_payment_intent_id = $1`,
          [canceledIntent.id]
        );
        console.log(`⊘ Payment canceled: ${canceledIntent.id}`);
        break;
    }
  } catch (error) {
    console.error('Webhook error:', error);
  }
};

/**
 * Get payment history for a user
 */
export const getPaymentHistory = async (userId: string) => {
  try {
    const result = await query(
      `SELECT p.* FROM payments p
       INNER JOIN orders o ON p.order_id = o.id
       INNER JOIN buyers b ON o.buyer_id = b.id
       INNER JOIN users u ON b.user_id = u.id
       WHERE u.id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('Failed to get payment history:', error);
    throw error;
  }
};
