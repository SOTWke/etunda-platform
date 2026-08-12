import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

export const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

interface PaymentResponse {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

/**
 * Create a payment intent on the backend
 */
export const createPaymentIntent = async (
  amount: number,
  orderId: string
): Promise<PaymentIntent> => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('http://localhost:5000/api/payments/create-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Convert to cents
      orderId,
      currency: 'usd',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
};

/**
 * Confirm payment with Stripe
 */
export const confirmPayment = async (
  paymentIntentId: string,
  paymentMethodId: string
): Promise<PaymentResponse> => {
  const token = localStorage.getItem('authToken');

  const response = await fetch('http://localhost:5000/api/payments/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      paymentIntentId,
      paymentMethodId,
    }),
  });

  if (!response.ok) {
    return {
      success: false,
      error: 'Payment confirmation failed',
    };
  }

  const data = await response.json();
  return {
    success: true,
    paymentIntentId: data.id,
  };
};

/**
 * Get payment status
 */
export const getPaymentStatus = async (
  paymentIntentId: string
): Promise<any> => {
  const token = localStorage.getItem('authToken');

  const response = await fetch(
    `http://localhost:5000/api/payments/status/${paymentIntentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get payment status');
  }

  return response.json();
};
