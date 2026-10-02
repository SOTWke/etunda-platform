import { Request, Response } from 'express';
import * as productService from '../services/productService';
import * as farmerService from '../services/farmerService';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const products = await productService.getAllProducts(limit, offset);
    res.json({ data: products, limit, offset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    res.json({ data: product });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (role !== 'farmer') {
      return res.status(403).json({ error: 'Only farmers can create products' });
    }

    let farmer;
    try {
      farmer = await farmerService.getFarmerByUserId(userId);
    } catch (error) {
      return res.status(403).json({
        error: 'Farmer profile required. Please create a farmer profile first.',
      });
    }

    const farmerId = farmer.id;

    const {
      name,
      description,
      price,
      quantity,
      category,
      unit,
      harvest_date,
      quality_grade,
      minimum_order_quantity,
      images,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number' });
    }

    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
      return res.status(400).json({ error: 'Quantity must be a non-negative number' });
    }

    if (
      minimum_order_quantity !== undefined &&
      (typeof minimum_order_quantity !== 'number' || minimum_order_quantity < 1)
    ) {
      return res.status(400).json({ error: 'minimum_order_quantity must be at least 1' });
    }

    if (images !== undefined && !Array.isArray(images)) {
      return res.status(400).json({ error: 'images must be an array of URLs' });
    }

    const product = await productService.createProduct(
      name,
      description || '',
      price,
      quantity || 0,
      farmerId,
      category || 'General',
      {
        unit,
        harvest_date,
        quality_grade,
        minimum_order_quantity,
        images,
      }
    );
    res.status(201).json({ data: product });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (role !== 'farmer') {
      return res.status(403).json({ error: 'Only farmers can update products' });
    }

    const { id } = req.params;
    const product = await productService.getProductById(id);

    let farmer;
    try {
      farmer = await farmerService.getFarmerByUserId(userId);
    } catch (error) {
      return res.status(403).json({ error: 'Farmer profile required' });
    }

    if (product.farmer_id !== farmer.id) {
      return res.status(403).json({ error: 'You can only update your own products' });
    }

    const updated = await productService.updateProduct(id, req.body);
    res.json({ data: updated });
  } catch (error: any) {
    res
      .status(error.message.includes('not found') ? 404 : 400)
      .json({ error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (role !== 'farmer') {
      return res.status(403).json({ error: 'Only farmers can delete products' });
    }

    const { id } = req.params;
    const product = await productService.getProductById(id);

    let farmer;
    try {
      farmer = await farmerService.getFarmerByUserId(userId);
    } catch (error) {
      return res.status(403).json({ error: 'Farmer profile required' });
    }

    if (product.farmer_id !== farmer.id) {
      return res.status(403).json({ error: 'You can only delete your own products' });
    }

    await productService.deleteProduct(id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    res
      .status(error.message.includes('not found') ? 404 : 400)
      .json({ error: error.message });
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const searchTerm = typeof q === 'string' ? q.trim() : '';

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const products = await productService.searchProducts(searchTerm);
    res.json({ data: products });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
