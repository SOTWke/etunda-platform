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

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get farmer profile by user ID
    let farmer;
    try {
      farmer = await farmerService.getFarmerByUserId(userId);
    } catch (error) {
      return res.status(403).json({ error: 'Farmer profile required. Please create a farmer profile first.' });
    }

    const farmerId = farmer.id;

    const { name, description, price, quantity, category } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const product = await productService.createProduct(
      name,
      description || '',
      price,
      quantity || 0,
      farmerId,
      category || 'General'
    );
    res.status(201).json({ data: product });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);
    res.json({ data: product });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const products = await productService.searchProducts(q as string);
    res.json({ data: products });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
