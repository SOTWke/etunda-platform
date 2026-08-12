import { Request, Response } from 'express';
import * as orderService from '../services/orderService';
import * as buyerService from '../services/buyerService';
import * as productService from '../services/productService';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;  // ✅ Get userId from JWT

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ✅ Get buyer profile from userId
    let buyer;
    try {
      buyer = await buyerService.getBuyerByUserId(userId);
    } catch (error) {
      return res.status(403).json({ error: 'Buyer profile required. Please create a buyer profile first.' });
    }

    const buyerId = buyer.id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    // ✅ Fetch actual product price from database
    let product;
    try {
      product = await productService.getProductById(productId);
    } catch (error) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // ✅ Validate stock before creating order
    if (product.quantity < quantity) {
      return res.status(400).json({ 
        error: `Insufficient stock. Available: ${product.quantity}, Requested: ${quantity}` 
      });
    }

    // ✅ Recalculate total price server-side
    const totalPrice = Number((product.price * quantity).toFixed(2));

    const order = await orderService.createOrder(buyerId, productId, quantity, totalPrice);
    res.status(201).json({ data: order });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    res.json({ data: order });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const orders = await orderService.getAllOrders(limit, offset);
    res.json({ data: orders, limit, offset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const order = await orderService.updateOrderStatus(id, status);
    res.json({ data: order });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;  // ✅ Use userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ✅ Get buyer profile and then orders
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
