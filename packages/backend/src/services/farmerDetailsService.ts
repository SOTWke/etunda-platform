import { query } from '../config/database';
import { FarmerDetails } from '../models';

/**
 * Create farmer details (extended profile)
 * Called after farmer profile is created
 */
export const createFarmerDetails = async (farmerId: string): Promise<FarmerDetails> => {
  const result = await query(
    `INSERT INTO farmer_details (farmer_id, verification_status)
     VALUES ($1, 'unverified')
     RETURNING *`,
    [farmerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Failed to create farmer details');
  }

  return formatFarmerDetails(result.rows[0]);
};

/**
 * Get farmer details by farmer ID
 */
export const getFarmerDetailsByFarmerId = async (farmerId: string): Promise<FarmerDetails> => {
  const result = await query(
    `SELECT * FROM farmer_details WHERE farmer_id = $1`,
    [farmerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Farmer details not found');
  }

  return formatFarmerDetails(result.rows[0]);
};

/**
 * Update farmer details
 */
export const updateFarmerDetails = async (
  farmerId: string,
  updates: Partial<FarmerDetails>
): Promise<FarmerDetails> => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (updates.farm_name !== undefined) {
    fields.push(`farm_name = $${paramCount++}`);
    values.push(updates.farm_name);
  }
  if (updates.farm_location !== undefined) {
    fields.push(`farm_location = $${paramCount++}`);
    values.push(updates.farm_location);
  }
  if (updates.county !== undefined) {
    fields.push(`county = $${paramCount++}`);
    values.push(updates.county);
  }
  if (updates.latitude !== undefined) {
    fields.push(`latitude = $${paramCount++}`);
    values.push(updates.latitude);
  }
  if (updates.longitude !== undefined) {
    fields.push(`longitude = $${paramCount++}`);
    values.push(updates.longitude);
  }
  if (updates.profile_image_url !== undefined) {
    fields.push(`profile_image_url = $${paramCount++}`);
    values.push(updates.profile_image_url);
  }
  if (updates.farming_categories !== undefined) {
    fields.push(`farming_categories = $${paramCount++}`);
    // Store as JSONB
    values.push(typeof updates.farming_categories === 'string' 
      ? updates.farming_categories 
      : JSON.stringify(updates.farming_categories));
  }
  if (updates.crops_produce !== undefined) {
    fields.push(`crops_produce = $${paramCount++}`);
    // Store as JSONB
    values.push(typeof updates.crops_produce === 'string' 
      ? updates.crops_produce 
      : JSON.stringify(updates.crops_produce));
  }
  if (updates.farm_description !== undefined) {
    fields.push(`farm_description = $${paramCount++}`);
    values.push(updates.farm_description);
  }

  if (fields.length === 0) {
    // No updates
    return getFarmerDetailsByFarmerId(farmerId);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(farmerId);

  const queryText = `UPDATE farmer_details SET ${fields.join(', ')} WHERE farmer_id = $${paramCount} RETURNING *`;

  const result = await query(queryText, values);

  if (result.rows.length === 0) {
    throw new Error('Farmer details not found');
  }

  return formatFarmerDetails(result.rows[0]);
};

/**
 * Update verification status (admin only)
 */
export const updateVerificationStatus = async (
  farmerId: string,
  status: 'unverified' | 'pending' | 'verified' | 'rejected'
): Promise<FarmerDetails> => {
  const validStatuses = ['unverified', 'pending', 'verified', 'rejected'];
  
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid verification status. Valid: ${validStatuses.join(', ')}`);
  }

  const result = await query(
    `UPDATE farmer_details SET verification_status = $1, updated_at = CURRENT_TIMESTAMP WHERE farmer_id = $2 RETURNING *`,
    [status, farmerId]
  );

  if (result.rows.length === 0) {
    throw new Error('Farmer details not found');
  }

  return formatFarmerDetails(result.rows[0]);
};

/**
 * Get verified farmers (with pagination)
 */
export const getVerifiedFarmers = async (limit: number = 20, offset: number = 0): Promise<FarmerDetails[]> => {
  const result = await query(
    `SELECT fd.* FROM farmer_details fd
     WHERE verification_status = 'verified'
     ORDER BY fd.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows.map(row => formatFarmerDetails(row));
};

/**
 * Search farmers by county or farming categories
 */
export const searchFarmersByCounty = async (county: string, limit: number = 20, offset: number = 0): Promise<FarmerDetails[]> => {
  const result = await query(
    `SELECT * FROM farmer_details
     WHERE county ILIKE $1 AND verification_status = 'verified'
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [`%${county}%`, limit, offset]
  );

  return result.rows.map(row => formatFarmerDetails(row));
};

/**
 * Search farmers by farming categories
 */
export const searchFarmersByCategory = async (
  category: string,
  limit: number = 20,
  offset: number = 0
): Promise<FarmerDetails[]> => {
  const result = await query(
    `SELECT * FROM farmer_details
     WHERE farming_categories @> $1::jsonb AND verification_status = 'verified'
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [JSON.stringify([category]), limit, offset]
  );

  return result.rows.map(row => formatFarmerDetails(row));
};

/**
 * Helper function to format farmer details response
 * Parse JSONB fields back to arrays
 */
const formatFarmerDetails = (row: any): FarmerDetails => {
  return {
    ...row,
    farming_categories: row.farming_categories || [],
    crops_produce: row.crops_produce || [],
  };
};
