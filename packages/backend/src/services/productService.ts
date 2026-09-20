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
    fields.push(`name = \]{paramCount++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = \[ {paramCount++}`);
    values.push(updates.description);
  }
  if (updates.price !== undefined) {
    fields.push(`price = \]{paramCount++}`);
    values.push(updates.price);
  }
  if (updates.quantity !== undefined) {
    fields.push(`quantity = \[ {paramCount++}`);
    values.push(updates.quantity);
  }
  if (updates.category !== undefined) {
    fields.push(`category = \]{paramCount++}`);
    values.push(updates.category);
  }
  if (updates.unit !== undefined) {
    fields.push(`unit = \[ {paramCount++}`);
    values.push(updates.unit);
  }
  if (updates.harvest_date !== undefined) {
    fields.push(`harvest_date = \]{paramCount++}`);
    values.push(updates.harvest_date);
  }
  if (updates.quality_grade !== undefined) {
    fields.push(`quality_grade = \[ {paramCount++}`);
    values.push(updates.quality_grade);
  }
  if (updates.minimum_order_quantity !== undefined) {
    fields.push(`minimum_order_quantity = \]{paramCount++}`);
    values.push(updates.minimum_order_quantity);
  }
  if (updates.images !== undefined) {
    fields.push(`images = \[ {paramCount++}::jsonb`);
    values.push(JSON.stringify(updates.images));
  }

  if (fields.length === 0) {
    return getProductById(id);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const queryText = `UPDATE products SET ${fields.join(', ')} WHERE id = \]{paramCount} RETURNING *`;
  const result = await query(queryText, values);

  if (result.rows.length === 0) {
    throw new Error('Product not found');
  }

  return result.rows[0];
};
