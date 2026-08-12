import { query } from '../config/database';
import { Buyer } from '../models';

export const createBuyer = async (userId: string, name: string, location: string, phone: string): Promise<Buyer> => {
  const result = await query(
    `INSERT INTO buyers (user_id, name, location, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, name, location, phone]
  );

  return result.rows[0];
};

export const getBuyerById = async (id: string): Promise<Buyer> => {
  const result = await query(`SELECT * FROM buyers WHERE id = $1`, [id]);

  if (result.rows.length === 0) {
    throw new Error('Buyer not found');
  }

  return result.rows[0];
};

export const getBuyerByUserId = async (userId: string): Promise<Buyer> => {
  const result = await query(`SELECT * FROM buyers WHERE user_id = $1`, [userId]);

  if (result.rows.length === 0) {
    throw new Error('Buyer profile not found');
  }

  return result.rows[0];
};

export const getAllBuyers = async (limit: number = 20, offset: number = 0): Promise<Buyer[]> => {
  const result = await query(
    `SELECT * FROM buyers ORDER BY rating DESC, created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

export const updateBuyer = async (id: string, updates: Partial<Buyer>): Promise<Buyer> => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.location !== undefined) {
    fields.push(`location = $${paramCount++}`);
    values.push(updates.location);
  }
  if (updates.phone !== undefined) {
    fields.push(`phone = $${paramCount++}`);
    values.push(updates.phone);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query_text = `UPDATE buyers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

  const result = await query(query_text, values);

  if (result.rows.length === 0) {
    throw new Error('Buyer not found');
  }

  return result.rows[0];
};

export const updateBuyerRating = async (buyerId: string, rating: number): Promise<Buyer> => {
  const result = await query(`UPDATE buyers SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`, [
    rating,
    buyerId,
  ]);

  if (result.rows.length === 0) {
    throw new Error('Buyer not found');
  }

  return result.rows[0];
};
