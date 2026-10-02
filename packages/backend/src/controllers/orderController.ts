import { Request, Response } from 'express';
import * as orderService from '../services/orderService';
import * as buyerService from '../services/buyerService';
import * as productService from '../services/productService';
import * as farmerService from '../services/farmerService';

/**
 * Create a new order
 * - Validates buyer profile exists
 * - Fetches current product price from DB (server-side calculation)
 * - Validates stock availability
 * - Creates order with atomic stock decrement
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Resolve buyer profile from authenticated user
    let buyer;
    try {
      buyer = await buyerService.getBuyerByUserId(userId);
    } catch (error) {
      return res.status(403).json({
        error: 'Buyer profile required. Please create a buyer profile first.',
      });
    }

    const buyerId = buyer.id;
    const { productId, quantity } = req.body;

    // Strict input validation
    if (!productId || quantity === undefined) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    // Fetch product to validate existence and get current price
    let product;
    try {
      product = await productService.getProductById(productId);
    } catch (error) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check stock availability
    if (product.quantity < quantity) {
      return res.status(409).json({
        error: `Insufficient stock. Available: ${product.quantity}, Requested: ${quantity}`,
      });
    }

    // Server-side total price calculation (never trust frontend)
    const totalPrice = Number((product.price * quantity).toFixed(2));

    // Create order with atomic stock decrement
    const order = await orderService.createOrder(buyerId, productId, quantity, totalPrice);
    res.status(201).json({ data: order });
  } catch (error: any) {
    if (error.message.includes('Insufficient stock')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get a single order by ID
 * - Allows buyer to view their own orders
 * - Allows farmer to view orders for their products
 */
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order = await orderService.getOrderById(id);

    // Authorization: buyer sees their orders, farmer sees orders for their products
    if (role === 'buyer') {
      const buyer = await buyerService.getBuyerByUserId(userId);
      if (order.buyer_id !== buyer.id) {
        return res.status(403).json({ error: 'You can only view your own orders' });
      }
    } else if (role === 'farmer') {
      const farmer = await farmerService.getFarmerByUserId(userId);
      const product = await productService.getProductById(order.product_id);
      if (product.farmer_id !== farmer.id) {
        return res.status(403).json({ error: 'You can only view orders for your products' });
      }
    } else if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ data: order });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
  }
};

/**
 * Get all orders (admin only)
 */
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    const orders = await orderService.getAllOrders(limit, offset);
    res.json({ data: orders, limit, offset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update order status with role-based authorization
 * - Buyers can only cancel pending orders
 * - Farmers can accept/reject/process orders for their products
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = (req as any).user;

    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const order = await orderService.updateOrderStatus(id, status, {
      role: user.role,
      userId: user.id,
    });

    res.json({ data: order });
  } catch (error: any) {
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('Invalid') || error.message.includes('only')
        ? 400
        : 409;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Get buyer's own orders
 */
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let buyer;
    try {
      buyer = await buyerService.getBuyerByUserId(userId);
    } catch (error) {
      return res.status(403).json({ error: 'Buyer profile required' });
    }

    const orders = await orderService.getOrdersByBuyer(buyer.id);
    res.json({ data: orders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get farmer's orders for their products
 */
export const getFarmerOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (role !== 'farmer') {
      return res.status(403).json({ error: 'Only farmers can view farmer orders' });
    }

    let farmer;
    try {
      farmer = await farmerService.getFarmerByUserId(userId);
    } catch (error) {
      return res.status(403).json({ error: 'Farmer profile required' });
    }

    const status = req.query.status as string | undefined;
    const orders = await orderService.getOrdersByFarmer(farmer.id, status);
    res.json({ data: orders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Farmer accepts order
 */
export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;
    const { id } = req.params;

    if (!userId || role !== 'farmer') {
      return res.status(403).json({ error: 'Only farmers can accept orders' });
    }

    const order = await orderService.updateOrderStatus(id, 'accepted', {
      role: 'farmer',
      userId,
    });
    res.json({ data: order });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Farmer rejects order
 */
export const rejectOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;
    const { id } = req.params;

    if (!userId || role !== 'farmer') {
      return res.status(403).json({ error: 'Only farmers can reject orders' });
    }

    const order = await orderService.updateOrderStatus(id, 'rejected', {
      role: 'farmer',
      userId,
    });
    res.json({ data: order });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ error: error.message });
  }
};
