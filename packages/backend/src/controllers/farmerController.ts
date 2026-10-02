import { Request, Response } from 'express';
import * as farmerService from '../services/farmerService';
import * as farmerDetailsService from '../services/farmerDetailsService';

/**
 * Create farmer profile
 * - One farmer profile per user
 * - Only users with 'farmer' role can create
 */
export const createFarmer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (role !== 'farmer') {
      return res.status(403).json({ error: 'Only farmers can create farmer profiles' });
    }

    // Check if farmer profile already exists
    try {
      await farmerService.getFarmerByUserId(userId);
      return res.status(409).json({ error: 'Farmer profile already exists' });
    } catch (error) {
      // Profile doesn't exist, continue
    }

    const { name, location, phone, bio } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
    }

    const farmer = await farmerService.createFarmer(
      userId,
      name.trim(),
      location || '',
      phone || '',
      bio || ''
    );
    res.status(201).json({ data: farmer });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get farmer by ID (public)
 */
export const getFarmerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const farmer = await farmerService.getFarmerById(id);

    let farmerDetails = null;
    try {
      farmerDetails = await farmerDetailsService.getFarmerDetailsByFarmerId(id);
    } catch (error) {
      // Details may not exist yet
    }

    res.json({ data: { ...farmer, details: farmerDetails } });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

/**
 * Get all farmers with pagination
 */
export const getAllFarmers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    const farmers = await farmerService.getAllFarmers(limit, offset);
    res.json({ data: farmers, limit, offset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update farmer profile
 * - Only farmer can update their own profile
 */
export const updateFarmer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const farmer = await farmerService.getFarmerById(id);

    if (farmer.user_id !== userId) {
      return res.status(403).json({ error: 'Cannot update another farmer\'s profile' });
    }

    const updated = await farmerService.updateFarmer(id, req.body);
    res.json({ data: updated });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Get authenticated farmer's own profile
 */
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const farmer = await farmerService.getFarmerByUserId(userId);

    let farmerDetails = null;
    try {
      farmerDetails = await farmerDetailsService.getFarmerDetailsByFarmerId(farmer.id);
    } catch (error) {
      // Details may not exist yet
    }

    res.json({ data: { ...farmer, details: farmerDetails } });
  } catch (error: any) {
    res.status(404).json({ error: 'Farmer profile not found' });
  }
};

/**
 * Update extended farm profile
 */
export const updateFarmProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const farmer = await farmerService.getFarmerByUserId(userId);

    const {
      farm_name,
      farm_location,
      county,
      latitude,
      longitude,
      profile_image_url,
      farming_categories,
      crops_produce,
      farm_description,
    } = req.body;

    // Validate GPS coordinates
    if (latitude !== undefined && longitude !== undefined) {
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Latitude and longitude must be numbers' });
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: 'Invalid GPS coordinates' });
      }
    }

    if (farming_categories !== undefined && !Array.isArray(farming_categories)) {
      return res.status(400).json({ error: 'farming_categories must be an array' });
    }

    if (crops_produce !== undefined && !Array.isArray(crops_produce)) {
      return res.status(400).json({ error: 'crops_produce must be an array' });
    }

    const updated = await farmerDetailsService.updateFarmerDetails(farmer.id, {
      farm_name,
      farm_location,
      county,
      latitude,
      longitude,
      profile_image_url,
      farming_categories: farming_categories ? JSON.stringify(farming_categories) : undefined,
      crops_produce: crops_produce ? JSON.stringify(crops_produce) : undefined,
      farm_description,
    } as any);

    res.json({ data: updated });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Get farm profile details
 */
export const getFarmProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const farmer = await farmerService.getFarmerByUserId(userId);
    const farmDetails = await farmerDetailsService.getFarmerDetailsByFarmerId(farmer.id);

    res.json({ data: farmDetails });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

/**
 * Get verified farmers
 */
export const getVerifiedFarmers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    const farmers = await farmerDetailsService.getVerifiedFarmers(limit, offset);
    res.json({ data: farmers, limit, offset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Search farmers by county
 */
export const searchByCounty = async (req: Request, res: Response) => {
  try {
    const { county } = req.query;
    const countyStr = typeof county === 'string' ? county.trim() : '';

    if (!countyStr) {
      return res.status(400).json({ error: 'County parameter required' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    const farmers = await farmerDetailsService.searchFarmersByCounty(countyStr, limit, offset);
    res.json({ data: farmers, limit, offset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Search farmers by farming category
 */
export const searchByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const categoryStr = typeof category === 'string' ? category.trim() : '';

    if (!categoryStr) {
      return res.status(400).json({ error: 'Category parameter required' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    const farmers = await farmerDetailsService.searchFarmersByCategory(categoryStr, limit, offset);
    res.json({ data: farmers, limit, offset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
