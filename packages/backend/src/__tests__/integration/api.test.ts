import request from 'supertest';
import app from '../../index';
import { query } from '../../config/database';

describe('eTunda Platform - Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let farmerId: string;
  let buyerId: string;
  let productId: string;
  let orderId: string;

  // Clean up database before tests
  beforeAll(async () => {
    // Note: In production, use a separate test database
    console.log('Integration tests starting...');
  });

  describe('Authentication Feature', () => {
    it('should register a new farmer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `farmer_${Date.now()}@test.com`,
          password: 'TestPass123!',
          role: 'farmer',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('farmer');

      authToken = res.body.token;
      userId = res.body.user.id;
    });

    it('should not register with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPass123!',
          role: 'farmer',
        });

      expect(res.status).toBe(400);
    });

    it('should login existing user', async () => {
      const email = `buyer_${Date.now()}@test.com`;
      
      // Register first
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'TestPass123!',
          role: 'buyer',
        });

      // Then login
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password: 'TestPass123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(email);
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'WrongPass',
        });

      expect(res.status).toBe(401);
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe(userId);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/profile');

      expect(res.status).toBe(401);
    });
  });

  describe('Farmers Feature', () => {
    it('should create farmer profile', async () => {
      const res = await request(app)
        .post('/api/farmers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Farmer',
          location: 'Kisii County, Kenya',
          phone: '+254712345678',
          bio: 'Organic farming specialist',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('John Farmer');
      expect(res.body.data.rating).toBe(0);

      farmerId = res.body.data.id;
    });

    it('should get all farmers', async () => {
      const res = await request(app).get('/api/farmers');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.limit).toBe(20);
      expect(res.body.offset).toBe(0);
    });

    it('should get farmer by ID', async () => {
      const res = await request(app).get(`/api/farmers/${farmerId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(farmerId);
      expect(res.body.data.name).toBe('John Farmer');
    });

    it('should get my farmer profile', async () => {
      const res = await request(app)
        .get('/api/farmers/profile/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(farmerId);
    });

    it('should update farmer profile', async () => {
      const res = await request(app)
        .put(`/api/farmers/${farmerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Farmer Updated',
          bio: 'Updated bio',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('John Farmer Updated');
    });

    it('should paginate farmers', async () => {
      const res = await request(app).get('/api/farmers?limit=5&offset=0');

      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(5);
      expect(res.body.offset).toBe(0);
    });
  });

  describe('Products Feature', () => {
    it('should create product as farmer', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Organic Tomatoes',
          description: 'Fresh red tomatoes grown organically',
          price: 80,
          quantity: 500,
          category: 'Vegetables',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Organic Tomatoes');
      expect(res.body.data.price).toBe(80);
      expect(res.body.data.quantity).toBe(500);

      productId = res.body.data.id;
    });

    it('should not create product without farmer profile', async () => {
      // Register new user but don't create farmer profile
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `nofarmer_${Date.now()}@test.com`,
          password: 'TestPass123!',
          role: 'farmer',
        });

      const token = res.body.token;

      const productRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Product',
          price: 100,
          quantity: 10,
        });

      expect(productRes.status).toBe(403);
      expect(productRes.body.error).toContain('Farmer profile required');
    });

    it('should get all products', async () => {
      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should get product by ID', async () => {
      const res = await request(app).get(`/api/products/${productId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(productId);
      expect(res.body.data.name).toBe('Organic Tomatoes');
    });

    it('should search products', async () => {
      const res = await request(app).get('/api/products/search?q=tomato');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should update product', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          price: 90,
          quantity: 400,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.price).toBe(90);
      expect(res.body.data.quantity).toBe(400);
    });

    it('should paginate products', async () => {
      const res = await request(app).get('/api/products?limit=10&offset=0');

      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(10);
      expect(res.body.offset).toBe(0);
    });

    it('should delete product', async () => {
      // Create temporary product to delete
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Temporary Product',
          price: 50,
          quantity: 100,
          category: 'Test',
        });

      const tempProductId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/products/${tempProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toContain('deleted successfully');
    });
  });

  describe('Buyers Feature', () => {
    let buyerToken: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `buyer_${Date.now()}@test.com`,
          password: 'BuyerPass123!',
          role: 'buyer',
        });

      buyerToken = res.body.token;
    });

    it('should create buyer profile', async () => {
      const res = await request(app)
        .post('/api/buyers')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: 'Alice Buyer',
          location: 'Nairobi, Kenya',
          phone: '+254712987654',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Alice Buyer');
      expect(res.body.data.rating).toBe(0);

      buyerId = res.body.data.id;
    });

    it('should get all buyers', async () => {
      const res = await request(app).get('/api/buyers');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should get buyer by ID', async () => {
      const res = await request(app).get(`/api/buyers/${buyerId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(buyerId);
    });

    it('should get my buyer profile', async () => {
      const res = await request(app)
        .get('/api/buyers/profile/me')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(buyerId);
    });

    it('should update buyer profile', async () => {
      const res = await request(app)
        .put(`/api/buyers/${buyerId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: 'Alice Updated',
          location: 'Mombasa, Kenya',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Alice Updated');
    });
  });

  describe('Orders Feature', () => {
    let buyerToken: string;
    let tempBuyerId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `orderbuyer_${Date.now()}@test.com`,
          password: 'OrderPass123!',
          role: 'buyer',
        });

      buyerToken = res.body.token;

      const buyerRes = await request(app)
        .post('/api/buyers')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: 'Order Buyer',
          location: 'Nairobi',
          phone: '+254712345678',
        });

      tempBuyerId = buyerRes.body.data.id;
    });

    it('should create order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          productId,
          quantity: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.product_id).toBe(productId);
      expect(res.body.data.quantity).toBe(50);
      expect(res.body.data.status).toBe('pending');

      orderId = res.body.data.id;
    });

    it('should not create order without buyer profile', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `nobuyer_${Date.now()}@test.com`,
          password: 'NoPass123!',
          role: 'buyer',
        });

      const token = res.body.token;

      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
          quantity: 10,
        });

      expect(orderRes.status).toBe(403);
    });

    it('should get all orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should get order by ID', async () => {
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(orderId);
    });

    it('should get my orders', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should update order status to confirmed', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'confirmed',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('confirmed');
    });

    it('should update order status to shipped', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'shipped',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('shipped');
    });

    it('should update order status to delivered', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'delivered',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('delivered');
    });

    it('should reject invalid order status', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'invalid_status',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Health & Error Handling', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.timestamp).toBeDefined();
    });

    it('should return 404 for non-existent route', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(res.status).toBe(404);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          // Missing password
        });

      expect(res.status).toBe(400);
    });
  });
});
