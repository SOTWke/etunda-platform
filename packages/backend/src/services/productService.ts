import { query } from '../config/database';
import { Product } from '../models';

export const getAllProducts = async (limit: number = 20, offset: number = 0): Promise<Product[]> => {
  const result = await query(
    `SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

export const getProductById = async (id: string): Promise<Product> => {
  const result = await query(`SELECT * FROM products WHERE id = $1`, [id]);

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
  category: string
): Promise<Product> => {
  const result = await query(
    `INSERT INTO products (name, description, price, quantity, farmer_id, category)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, description, price, quantity, farmerId, category]
  );

  return result.rows[0];
};

export const updateProduct = async (
  id: string,
  { name, description, price, quantity, category }: Partial<Product>
): Promise<Product> => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(name);
  }
  if (description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(description);
  }
  if (price !== undefined) {
    fields.push(`price = $${paramCount++}`);
    values.push(price);
  }
  if (quantity !== undefined) {
    fields.push(`quantity = $${paramCount++}`);
    values.push(quantity);
  }
  if (category !== undefined) {
    fields.push(`category = $${paramCount++}`);
    values.push(category);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query_text = `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

  const result = await query(query_text, values);

  if (result.rows.length === 0) {
    throw new Error('Product not found');
  }

  return result.rows[0];
};

export const deleteProduct = async (id: string): Promise<void> => {
  const result = await query(`DELETE FROM products WHERE id = $1`, [id]);

  if (result.rowCount === 0) {
    throw new Error('Product not found');
  }
};

export const getProductsByFarmer = async (farmerId: string): Promise<Product[]> => {
  const result = await query(`SELECT * FROM products WHERE farmer_id = $1 ORDER BY created_at DESC`, [farmerId]);
  return result.rows;
};

export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  const result = await query(
    `SELECT * FROM products WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY created_at DESC`,
    [`%${searchTerm}%`]
  );
  return result.rows;
};
