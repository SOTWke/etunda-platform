import { query } from '../config/database';
import { Product } from '../models';

export const getAllProducts = async (limit: number = 20, offset: number = 0): Promise<Product[]> => {
  const result = await query(
    'SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows;
};

export const getProductById = async (id: string): Promise<Product> => {
  const result = await query('SELECT * FROM products WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw new Error('Product not found');
  }

  return result.rows[0];
};

export const createProduct = async (
  name: string,
  description: string,
  price: number,
  quantity: number,
  farmerId: string,
  category: string,
  options?: {
    unit?: string;
    harvest_date?: string | null;
    quality_grade?: string | null;
    minimum_order_quantity?: number;
    images?: string[];
  }
): Promise<Product> => {
  const unit = options?.unit || 'kg';
  const harvestDate = options?.harvest_date || null;
  const qualityGrade = options?.quality_grade || null;
  const moq = options?.minimum_order_quantity ?? 1;
  const images = JSON.stringify(options?.images || []);

  const result = await query(
    `INSERT INTO products (
       name, description, price, quantity, farmer_id, category,
       unit, harvest_date, quality_grade, minimum_order_quantity, images
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
     RETURNING *`,
    [name, description, price, quantity, farmerId, category, unit, harvestDate, qualityGrade, moq, images]
  );

  return result.rows[0];
};

export const updateProduct = async (
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    price: number;
    quantity: number;
    category: string;
    unit: string;
    harvest_date: string | null;
    quality_grade: string | null;
    minimum_order_quantity: number;
    images: string[];
  }>
): Promise<Product> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.name !== undefined) {
    fields.push('name = $' + paramCount++);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = $' + paramCount++);
    values.push(updates.description);
  }
  if (updates.price !== undefined) {
    fields.push('price = $' + paramCount++);
    values.push(updates.price);
  }
  if (updates.quantity !== undefined) {
    fields.push('quantity = $' + paramCount++);
    values.push(updates.quantity);
  }
  if (updates.category !== undefined) {
    fields.push('category = $' + paramCount++);
    values.push(updates.category);
  }
  if (updates.unit !== undefined) {
    fields.push('unit = $' + paramCount++);
    values.push(updates.unit);
  }
  if (updates.harvest_date !== undefined) {
    fields.push('harvest_date = $' + paramCount++);
    values.push(updates.harvest_date);
  }
  if (updates.quality_grade !== undefined) {
    fields.push('quality_grade = $' + paramCount++);
    values.push(updates.quality_grade);
  }
  if (updates.minimum_order_quantity !== undefined) {
    fields.push('minimum_order_quantity = $' + paramCount++);
    values.push(updates.minimum_order_quantity);
  }
  if (updates.images !== undefined) {
    fields.push('images = $' + paramCount++ + '::jsonb');
    values.push(JSON.stringify(updates.images));
  }

  if (fields.length === 0) {
    return getProductById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const queryText =
    'UPDATE products SET ' + fields.join(', ') + ' WHERE id = $' + paramCount + ' RETURNING *';
  const result = await query(queryText, values);

  if (result.rows.length === 0) {
    throw new Error('Product not found');
  }

  return result.rows[0];
};

export const deleteProduct = async (id: string): Promise<void> => {
  const result = await query('DELETE FROM products WHERE id = $1', [id]);

  if (result.rowCount === 0) {
    throw new Error('Product not found');
  }
};

export const getProductsByFarmer = async (farmerId: string): Promise<Product[]> => {
  const result = await query(
    'SELECT * FROM products WHERE farmer_id = $1 ORDER BY created_at DESC',
    [farmerId]
  );
  return result.rows;
};

export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  const result = await query(
    `SELECT * FROM products
     WHERE name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1
     ORDER BY created_at DESC`,
    ['%' + searchTerm + '%']
  );
  return result.rows;
};
