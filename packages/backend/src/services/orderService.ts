import { query, getClient } from '../config/database';
import { Order } from '../models';

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

    // Lock the product row so concurrent orders cannot oversell
    const productResult = await client.query(
      `SELECT id, quantity, price FROM products WHERE id = $1 FOR UPDATE`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      throw new Error('Product not found');
    }

    const product = productResult.rows[0];

    if (product.quantity < quantity) {
      throw new Error(
        `Insufficient stock. Available: ${product.quantity}, Requested: ${quantity}`
      );
    }

    // Insert the order
    const orderResult = await client.query(
      `INSERT INTO orders (buyer_id, product_id, quantity, total_price, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [buyerId, productId, quantity, totalPrice]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Failed to create order');
    }

    // Decrement inventory under the same lock
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

export const getOrderById = async (id: string): Promise<Order> => {
  const result = await query(`SELECT * FROM orders WHERE id = $1`, [id]);

  if (result.rows.length === 0) {
    throw new Error('Order not found');
  }

  return result.rows[0];
};

export const getOrdersByBuyer = async (buyerId: string): Promise<Order[]> => {
  const result = await query(
    `SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC`,
    [buyerId]
  );
  return result.rows;
};

export const getOrdersByProduct = async (productId: string): Promise<Order[]> => {
  const result = await query(
    `SELECT * FROM orders WHERE product_id = $1 ORDER BY created_at DESC`,
    [productId]
  );
  return result.rows;
};

export const getAllOrders = async (
  limit: number = 20,
  offset: number = 0
): Promise<Order[]> => {
  const result = await query(
    `SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

export const updateOrderStatus = async (
  id: string,
  status: string
): Promise<Order> => {
  const validStatuses = [
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
  ];

  if (!validStatuses.includes(status)) {
    throw new Error(
      `Invalid order status. Valid statuses: ${validStatuses.join(', ')}`
    );
  }

  const result = await query(
    `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    [status, id]
  );

  if (result.rows.length === 0) {
    throw new Error('Order not found');
  }

  return result.rows[0];
};

export const cancelOrder = async (id: string): Promise<Order> => {
  return updateOrderStatus(id, 'cancelled');
};
