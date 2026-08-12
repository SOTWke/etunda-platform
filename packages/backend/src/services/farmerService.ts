import { query } from '../config/database';
import { Farmer } from '../models';
import * as farmerDetailsService from './farmerDetailsService';

export const createFarmer = async (
  userId: string,
  name: string,
  location: string,
  phone: string,
  bio: string
): Promise<Farmer> => {
  const result = await query(
    `INSERT INTO farmers (user_id, name, location, phone, bio)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, name, location, phone, bio]
  );

  const farmer = result.rows[0];

  // ✅ Auto-create farmer details record
  try {
    await farmerDetailsService.createFarmerDetails(farmer.id);
  } catch (error) {
    console.error('Failed to create farmer details:', error);
    // Don't fail the whole operation if details creation fails
  }

  return farmer;
};

export const getFarmerById = async (id: string): Promise<Farmer> => {
  const result = await query(`SELECT * FROM farmers WHERE id = $1`, [id]);

  if (result.rows.length === 0) {
    throw new Error('Farmer not found');
  }

  return result.rows[0];
};

export const getFarmerByUserId = async (userId: string): Promise<Farmer> => {
  const result = await query(`SELECT * FROM farmers WHERE user_id = $1`, [userId]);

  if (result.rows.length === 0) {
    throw new Error('Farmer profile not found');
  }

  return result.rows[0];
};

export const getAllFarmers = async (limit: number = 20, offset: number = 0): Promise<Farmer[]> => {
  const result = await query(
    `SELECT * FROM farmers ORDER BY rating DESC, created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

export const updateFarmer = async (id: string, updates: Partial<Farmer>): Promise<Farmer> => {
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
  if (updates.bio !== undefined) {
    fields.push(`bio = $${paramCount++}`);
    values.push(updates.bio);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const queryText = `UPDATE farmers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

  const result = await query(queryText, values);

  if (result.rows.length === 0) {
    throw new Error('Farmer not found');
  }

  return result.rows[0];
};

export const updateFarmerRating = async (farmerId: string, rating: number): Promise<Farmer> => {
  const result = await query(
    `UPDATE farmers SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    [rating, farmerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Farmer not found');
  }

  return result.rows[0];
};

// ✅ Re-export farmer details service methods for controller use
export { 
  getFarmerDetailsByFarmerId,
  updateFarmerDetails,
  updateVerificationStatus,
  getVerifiedFarmers,
  searchFarmersByCounty,
  searchFarmersByCategory
} from './farmerDetailsService';
