import { query, getClient } from '../config/database';
import { Order } from '../models';

const VALID_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'confirmed',
  'processing',
  'ready_for_pickup',
  'in_transit',
  'delivered',
  'completed',
  'cancelled',
  'disputed',
] as const;

type OrderStatus = (typeof VALID_STATUSES)[number];

// Allowed transitions (from → to[])
const TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['processing', 'cancelled', 'disputed'],
  rejected: [],
  confirmed: ['processing', 'cancelled', 'disputed'],
  processing: ['ready_for_pickup', 'cancelled', 'disputed'],
  ready_for_pickup: ['in_transit', 'cancelled', 'disputed'],
  in_transit: ['delivered', 'disputed'],
  delivered: ['completed', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: ['processing', 'cancelled', 'completed'],
};

export const createOrder = async (
  buyerId: string,
  productId: string,
  quantity: number,
  totalPrice: number
): Promise<Order> => {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const productResult = await client.query(
      'SELECT id, quantity, price FROM products WHERE id = $1 FOR UPDATE',
      [productId]
    );

    if (productResult.rows.length === 0) {
      throw new Error('Product not found');
    }

    const product = productResult.rows[0];

    if (product.quantity < quantity) {
      throw new Error(
        'Insufficient stock. Available: ' + product.quantity + ', Requested: ' + quantity
      );
    }

    const orderResult = await client.query(
      `INSERT INTO orders (buyer_id, product_id, quantity, total_price, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [buyerId, productId, quantity, totalPrice]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Failed to create order');
    }

    await client.query(
      `UPDATE products
       SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantity, productId]
    );

    await client.query('COMMIT');
    return orderResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getOrderById = async (id: string): Promise<any> => {
  const result = await query('SELECT * FROM orders WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw new Error('Order not found');
  }

  const order = result.rows[0];
  const items = await query(
    `SELECT oi.*, p.name AS product_name, p.unit
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [id]
  );

  return { ...order, items: items.rows };
};

export const getOrdersByBuyer = async (buyerId: string): Promise<any[]> => {
  const result = await query(
    'SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC',
    [buyerId]
  );
  return result.rows;
};

export const getOrdersByProduct = async (productId: string): Promise<Order[]> => {
  const result = await query(
    'SELECT * FROM orders WHERE product_id = $1 ORDER BY created_at DESC',
    [productId]
  );
  return result.rows;
};

export const getAllOrders = async (
  limit: number = 20,
  offset: number = 0
): Promise<Order[]> => {
  const result = await query(
    'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows;
};

/** Orders that include products belonging to this farmer */
export const getOrdersByFarmer = async (
  farmerId: string,
  status?: string
): Promise<any[]> => {
  let sql = `
    SELECT DISTINCT o.*
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = COALESCE(oi.product_id, o.product_id)
    WHERE p.farmer_id = $1
  `;
  const params: any[] = [farmerId];

  if (status) {
    sql += ' AND o.status = $2';
    params.push(status);
  }

  sql += ' ORDER BY o.created_at DESC';

  const result = await query(sql, params);
  return result.rows;
};

export const updateOrderStatus = async (
  id: string,
  newStatus: string,
  actor?: { role: string; userId?: string }
): Promise<Order> => {
  if (!VALID_STATUSES.includes(newStatus as OrderStatus)) {
    throw new Error('Invalid order status. Valid: ' + VALID_STATUSES.join(', '));
  }

  const currentResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
  if (currentResult.rows.length === 0) {
    throw new Error('Order not found');
  }

  const current = currentResult.rows[0];
  const from = current.status;
  const allowed = TRANSITIONS[from] || [];

  if (!allowed.includes(newStatus)) {
    throw new Error(
      'Invalid status transition from "' + from + '" to "' + newStatus +
      '". Allowed: ' + (allowed.length ? allowed.join(', ') : 'none')
    );
  }

  // Role rules: farmers accept/reject/process; buyers cancel from pending only
  if (actor) {
    if (actor.role === 'buyer') {
      if (!(from === 'pending' && newStatus === 'cancelled')) {
        throw new Error('Buyers can only cancel pending orders');
      }
    }
    if (actor.role === 'farmer') {
      const farmerAllowed = [
        'accepted',
        'rejected',
        'processing',
        'ready_for_pickup',
        'in_transit',
        'delivered',
        'completed',
      ];
      if (!farmerAllowed.includes(newStatus) && newStatus !== 'cancelled') {
        // farmers can also cancel in early stages via transition table
      }
    }
  }

  const result = await query(
    `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 RETURNING *`,
    [newStatus, id]
  );

  return result.rows[0];
};

export const cancelOrder = async (id: string): Promise<Order> => {
  return updateOrderStatus(id, 'cancelled');
};
