import { query } from '../config/database';

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'farmer' | 'buyer' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  farmer_id: string;
  category: string;
  created_at: Date;
  updated_at: Date;
}

export interface Farmer {
  id: string;
  user_id: string;
  name: string;
  location: string;
  phone: string;
  bio: string;
  rating: number;
  created_at: Date;
  updated_at: Date;
}

export interface FarmerDetails {
  id: string;
  farmer_id: string;
  farm_name: string;
  farm_location: string;
  county: string;
  latitude: number | null;
  longitude: number | null;
  profile_image_url: string | null;
  farming_categories: string;
  crops_produce: string;
  farm_description: string;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

export interface Buyer {
  id: string;
  user_id: string;
  name: string;
  location: string;
  phone: string;
  rating: number;
  created_at: Date;
  updated_at: Date;
}

// ✅ NEW: Extended buyer profile with business details
export interface BuyerDetails {
  id: string;
  buyer_id: string;
  business_name: string | null;
  business_type: 'individual' | 'organization' | 'wholesale' | 'retailer' | 'restaurant';
  business_location: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  profile_image_url: string | null;
  preferred_categories: string;  // JSON array: '["Vegetables", "Fruits"]'
  delivery_preferences: string;  // JSON array: '["Pickup", "Delivery", "Both"]'
  business_description: string | null;
  average_order_value: number | null;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'buyer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Farmers table
    await query(`
      CREATE TABLE IF NOT EXISTS farmers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        phone VARCHAR(20),
        bio TEXT,
        rating DECIMAL(3,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Farmer Details table
    await query(`
      CREATE TABLE IF NOT EXISTS farmer_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farmer_id UUID NOT NULL UNIQUE REFERENCES farmers(id) ON DELETE CASCADE,
        farm_name VARCHAR(255),
        farm_location VARCHAR(255),
        county VARCHAR(100),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        profile_image_url VARCHAR(500),
        farming_categories JSONB DEFAULT '[]',
        crops_produce JSONB DEFAULT '[]',
        farm_description TEXT,
        verification_status VARCHAR(50) DEFAULT 'unverified',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Buyers table
    await query(`
      CREATE TABLE IF NOT EXISTS buyers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        phone VARCHAR(20),
        rating DECIMAL(3,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ✅ NEW: Buyer Details table (1:1 relationship with buyers)
    await query(`
      CREATE TABLE IF NOT EXISTS buyer_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID NOT NULL UNIQUE REFERENCES buyers(id) ON DELETE CASCADE,
        business_name VARCHAR(255),
        business_type VARCHAR(50),
        business_location VARCHAR(255),
        county VARCHAR(100),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        profile_image_url VARCHAR(500),
        preferred_categories JSONB DEFAULT '[]',
        delivery_preferences JSONB DEFAULT '[]',
        business_description TEXT,
        average_order_value DECIMAL(10,2),
        verification_status VARCHAR(50) DEFAULT 'unverified',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        quantity INT DEFAULT 0,
        farmer_id UUID NOT NULL REFERENCES farmers(id),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID NOT NULL REFERENCES buyers(id),
        product_id UUID NOT NULL REFERENCES products(id),
        quantity INT NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    await query(`CREATE INDEX IF NOT EXISTS idx_products_farmer_id ON products(farmer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_farmer_details_farmer_id ON farmer_details(farmer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_farmer_details_county ON farmer_details(county)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_farmer_details_verification ON farmer_details(verification_status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_buyer_details_buyer_id ON buyer_details(buyer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_buyer_details_county ON buyer_details(county)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_buyer_details_business_type ON buyer_details(business_type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_buyer_details_verification ON buyer_details(verification_status)`);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};
