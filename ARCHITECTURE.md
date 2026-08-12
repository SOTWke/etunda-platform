# eTunda Platform - Technical Architecture Summary

## 🏗️ Modular System Design

### Core Principles
- **Separation of Concerns**: Each feature (auth, products, farmers, buyers, orders) is isolated
- **Scalability**: Services can be deployed independently via Docker
- **Testability**: Unit and integration tests per feature
- **Maintainability**: Clear layering (routes → controllers → services → models)

---

## 📦 Feature Modules

### 1. Authentication Module
**Location**: `packages/backend/src/services/authService.ts`

```
Entry: POST /api/auth/register → authController.register()
       ↓
authService.registerUser() → hash password → insert user → generate token
```

**Files**:
- `authService.ts` – JWT, password hashing, user registration/login
- `authController.ts` – HTTP request/response handling
- `authRoutes.ts` – Route definitions
- `auth.ts` (middleware) – Token verification, role-based access

**Database**: `users` table (id, email, password, role)

---

### 2. Products Module
**Location**: `packages/backend/src/services/productService.ts`

```
GET /api/products → productController.getAllProducts()
                  → productService.getAllProducts()
                  → query(SELECT * FROM products)
                  ↓
                  Return paginated results
```

**Files**:
- `productService.ts` – CRUD operations, search, filtering
- `productController.ts` – Request validation, response formatting
- `productRoutes.ts` – Route definitions with auth middleware
- Index enforcement: product queries use indexes on `farmer_id`

**Database**: `products` table (id, name, price, quantity, farmer_id, category)

**Optimization**:
- Pagination: default limit=20, offset=0
- Full-text search: `ILIKE` operator for product name/description
- Index: `idx_products_farmer_id` for fast farmer lookups

---

### 3. Farmers Module
**Location**: `packages/backend/src/services/farmerService.ts`

```
POST /api/farmers → farmerController.createFarmer()
                  → farmerService.createFarmer()
                  → INSERT INTO farmers
                  ↓
                  Link to user_id (foreign key)
```

**Files**:
- `farmerService.ts` – Profile CRUD, rating management
- `farmerController.ts` – Profile creation/updates
- `farmerRoutes.ts` – Authentication required for writes
- Rating system: average of all orders' ratings

**Database**: `farmers` table (id, user_id, name, location, phone, bio, rating)

**Relations**:
- 1:1 with `users` table via `user_id` FK
- 1:N with `products` table via farmer creating products

---

### 4. Buyers Module
**Location**: `packages/backend/src/services/buyerService.ts`

```
POST /api/buyers → buyerController.createBuyer()
                 → buyerService.createBuyer()
                 → INSERT INTO buyers
                 ↓
                 Link to user_id (foreign key)
```

**Files**:
- `buyerService.ts` – Profile CRUD, rating management
- `buyerController.ts` – Profile creation/updates
- `buyerRoutes.ts` – Authentication required for writes

**Database**: `buyers` table (id, user_id, name, location, phone, rating)

**Relations**:
- 1:1 with `users` table via `user_id` FK
- 1:N with `orders` table via buyer placing orders

---

### 5. Orders Module
**Location**: `packages/backend/src/services/orderService.ts`

```
POST /api/orders → orderController.createOrder()
                 → orderService.createOrder()
                 → INSERT INTO orders
                 → UPDATE products (decrement quantity)
                 ↓
                 Return order details
```

**Files**:
- `orderService.ts` – Order creation, status tracking, cancellation
- `orderController.ts` – Order validation, response formatting
- `orderRoutes.ts` – Authentication required (buyer-only)

**Database**: `orders` table (id, buyer_id, product_id, quantity, total_price, status)

**Status Flow**: `pending` → `confirmed` → `shipped` → `delivered` (or `cancelled`)

**Indexes**:
- `idx_orders_buyer_id` – Find orders by buyer
- `idx_orders_product_id` – Find orders by product

---

## 🗄️ Database Schema

```sql
users
  ├─ id (UUID, PK)
  ├─ email (VARCHAR, UNIQUE)
  ├─ password (VARCHAR, hashed)
  ├─ role (ENUM: farmer, buyer, admin)
  └─ created_at, updated_at

farmers
  ├─ id (UUID, PK)
  ├─ user_id (UUID, FK → users)
  ├─ name, location, phone, bio
  ├─ rating (DECIMAL 3,2)
  └─ created_at, updated_at

buyers
  ├─ id (UUID, PK)
  ├─ user_id (UUID, FK → users)
  ├─ name, location, phone
  ├─ rating (DECIMAL 3,2)
  └─ created_at, updated_at

products
  ├─ id (UUID, PK)
  ├─ farmer_id (UUID, FK → farmers)
  ├─ name, description, category
  ├─ price (DECIMAL 10,2)
  ├─ quantity (INT)
  └─ created_at, updated_at
  [INDEX] idx_products_farmer_id

orders
  ├─ id (UUID, PK)
  ├─ buyer_id (UUID, FK → buyers)
  ├─ product_id (UUID, FK → products)
  ├─ quantity (INT)
  ├─ total_price (DECIMAL 10,2)
  ├─ status (ENUM)
  └─ created_at, updated_at
  [INDEX] idx_orders_buyer_id, idx_orders_product_id
  [INDEX] idx_users_email
```

---

## 🔐 Authentication Flow

```
1. Register
   POST /api/auth/register
   {email, password, role}
   ↓
   bcryptjs.hash(password) → 10 rounds
   ↓
   INSERT INTO users
   ↓
   jwt.sign({id, email, role}, SECRET, {expiresIn: '7d'})
   ↓
   Response: {user, token}

2. Login
   POST /api/auth/login
   {email, password}
   ↓
   SELECT * FROM users WHERE email = $1
   ↓
   bcryptjs.compare(password, stored_hash)
   ↓
   jwt.sign() ... (same as register)
   ↓
   Response: {user, token}

3. Protected Route Access
   GET /api/farmers/profile/me
   Header: Authorization: Bearer <JWT_TOKEN>
   ↓
   authMiddleware extracts token
   ↓
   jwt.verify(token, SECRET)
   ↓
   req.user = {id, email, role}
   ↓
   Continue to controller
```

---

## 🚀 Scaling Strategies

### Vertical Scaling
- Increase node memory/CPU in docker-compose.yml
- Increase database connection pool (currently 20 max)

### Horizontal Scaling

**Load Balancer** (nginx)
```
LB (port 80/443)
  ├─ Backend Instance 1 (port 5001)
  ├─ Backend Instance 2 (port 5002)
  └─ Backend Instance 3 (port 5003)
```

**Database** 
- Master (write): Main PostgreSQL
- Replicas (read): For SELECT queries on farmers, products, buyers lists

**Cache** (Redis)
```
GET /api/products
  ↓
  Check Redis cache key "products:limit:20:offset:0"
  ↓
  If hit: return cached JSON (TTL: 5 minutes)
  ↓
  If miss: query database → cache result → return
```

**Docker Compose Scale**
```bash
docker compose up -d --scale backend=3
# Creates 3 backend instances with load balancing
```

---

## 🧪 Testing Architecture

### Unit Tests
**File**: `packages/backend/src/__tests__/unit/authService.test.ts`

```typescript
describe('Auth Service', () => {
  it('should hash password', async () => {
    const hash = await hashPassword('password123');
    const isValid = await comparePassword('password123', hash);
    expect(isValid).toBe(true);
  });
});
```

**Run**: `npm run test:unit`

### Integration Tests (TODO)
**File**: `packages/backend/src/__tests__/integration/auth.test.ts`

```typescript
describe('Auth Endpoints', () => {
  it('POST /api/auth/register should create user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({email: 'test@example.com', password: 'pass123'});
    
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });
});
```

**Run**: `npm run test:integration`

### Feature Isolation Testing

**docker-compose.test.yml**:
- Spins up separate test PostgreSQL (port 5433)
- Runs auth-service, products-service, orders-service independently
- Each feature can be tested in isolation

```bash
docker compose -f docker-compose.test.yml up
# Runs docker-compose.test.yml services
# Each container auto-runs: npm run test:unit
```

---

## 📊 Middleware Pipeline

```
Request
  ↓
[CORS Middleware] – Allow cross-origin requests
  ↓
[Helmet Middleware] – Security headers
  ↓
[Body Parser] – Parse JSON body
  ↓
[Logging Middleware] – Log request method/path
  ↓
[Authentication Middleware] (optional)
  ├─ Extract Bearer token
  ├─ jwt.verify(token)
  └─ Attach user to req.user
  ↓
[Role Middleware] (optional)
  └─ Check req.user.role in allowedRoles
  ↓
[Route Handler]
  ├─ Controller
  ├─ Service
  └─ Database Query
  ↓
[Error Handler]
  └─ Catch errors, return 400/401/500
  ↓
Response (JSON)
```

---

## 🔄 API Request-Response Cycle

### Example: Create Product

```
POST /api/products
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Tomatoes",
  "price": 80,
  "quantity": 500,
  "category": "Vegetables"
}

        ↓

[productRoutes.ts]
  POST '/' → authMiddleware → productController.createProduct()

        ↓

[productController.ts]
  1. Extract farmerId from req.user
  2. Validate request body {name, price required}
  3. Call productService.createProduct()

        ↓

[productService.ts]
  1. INSERT INTO products VALUES (...)
  2. Return product object with id

        ↓

[Response]
201 Created
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Tomatoes",
    "price": 80,
    "quantity": 500,
    "farmer_id": "user-farm-id",
    "category": "Vegetables",
    "created_at": "2026-08-12T08:16:56.954Z",
    "updated_at": "2026-08-12T08:16:56.954Z"
  }
}
```

---

## 🐳 Docker Deployment

### Development Stack
```yaml
docker-compose.yml
  ├─ postgres:16-alpine (port 5432)
  ├─ backend (port 5000, npm run dev)
  └─ frontend (port 3000, npm run dev)
```

### Production Stack (Future)
```yaml
docker-compose.prod.yml
  ├─ Load Balancer (nginx, port 80/443)
  ├─ Backend × 3 (port 5000, npm start)
  ├─ PostgreSQL Master (port 5432)
  ├─ PostgreSQL Replica (port 5433)
  ├─ Redis (port 6379)
  └─ Frontend (nginx static, port 3000)
```

---

## 📈 Performance Metrics

### Database Queries
- Connection pool: 20 max connections
- Query logging: All queries logged with execution time
- Indexes: 4 indexes for frequent lookups

### Response Times (Typical)
- List products: 50-100ms
- Create order: 200-300ms
- User registration: 150-250ms (bcrypt hashing)

### Caching (Future)
- Redis cache for: products list, farmer profiles, buyer profiles
- TTL: 5 minutes for lists, 1 hour for profiles

---

## 🔄 Deployment Workflow

```
1. Local Development
   npm run dev (backend)
   npm run dev (frontend)

2. Test
   npm run test (backend)
   npm run test (frontend)

3. Build Docker Images
   docker build -t etunda-backend packages/backend
   docker build -t etunda-frontend packages/frontend

4. Push to Registry
   docker push myregistry/etunda-backend:1.0.0
   docker push myregistry/etunda-frontend:1.0.0

5. Deploy to Staging
   kubectl apply -f k8s/staging/

6. E2E Tests on Staging
   npm run test:e2e

7. Deploy to Production
   kubectl apply -f k8s/production/

8. Health Checks
   GET /health (every 10s)
   GET /api/farmers (verify connectivity)
```

---

## 🎯 Key Metrics to Monitor

- **Uptime**: 99.9% target
- **Response Time**: p95 < 500ms
- **Error Rate**: < 0.1%
- **Database Connections**: < 18/20 max
- **CPU Usage**: < 70%
- **Memory Usage**: < 500MB per instance

---

## 📝 Code Organization Pattern

Every feature follows this structure:

```
Feature: Products
├── models/
│   └── index.ts (Product type, schema)
├── services/
│   └── productService.ts (business logic)
├── controllers/
│   └── productController.ts (HTTP handlers)
├── routes/
│   └── productRoutes.ts (endpoint definitions)
└── __tests__/
    ├── unit/
    │   └── productService.test.ts
    └── integration/
        └── productAPI.test.ts
```

This pattern ensures:
- ✅ Clear separation of concerns
- ✅ Easy to test each layer
- ✅ Scalable to microservices
- ✅ New developers can quickly understand structure

---

**Happy building! 🚀🌱**

For more details, see `FEATURE_DEVELOPMENT.md`
