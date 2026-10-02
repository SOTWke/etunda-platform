import { Request, Response } from 'express';
import * as buyerService from '../services/buyerService';

/**
 * Create buyer profile
 * - One buyer profile per user
 * - Only users with 'buyer' role can create
 */
export const createBuyer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (role !== 'buyer') {
      return res.status(403).json({ error: 'Only buyers can create buyer profiles' });
    }

    // Check if buyer profile already exists
    try {
      await buyerService.getBuyerByUserId(userId);
      return res.status(409).json({ error: 'Buyer profile already exists' });
    } catch (error) {
      // Profile doesn't exist, continue
    }

    const { name, location, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
    }

    const buyer = await buyerService.createBuyer(
      userId,
      name.trim(),
      location || '',
      phone || ''
    );
    res.status(201).json({ data: buyer });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get buyer by ID (public)
 */
export const getBuyerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const buyer = await buyerService.getBuyerById(id);
    res.json({ data: buyer });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

/**
 * Get all buyers with pagination
 */
export const getAllBuyers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    const buyers = await buyerService.getAllBuyers(limit, offset);
    res.json({ data: buyers, limit, offset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update buyer profile
 * - Only buyer can update their own profile
 */
export const updateBuyer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get buyer profile to check ownership
    const buyer = await buyerService.getBuyerById(id);

    // Only allow buyer to update their own profile
    if (buyer.user_id !== userId) {
      return res.status(403).json({ error: 'Cannot update another buyer\'s profile' });
    }

    const updated = await buyerService.updateBuyer(id, req.body);
    res.json({ data: updated });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Get authenticated buyer's own profile
 */
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const buyer = await buyerService.getBuyerByUserId(userId);
    res.json({ data: buyer });
  } catch (error: any) {
    res.status(404).json({ error: 'Buyer profile not found' });
  }
};
