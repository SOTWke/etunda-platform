# eTunda Platform - Modular Feature Development Guide

## Architecture Overview

```
etunda-platform/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/          # Database connection, environment config
│   │   │   ├── models/          # Data types and database initialization
│   │   │   ├── services/        # Business logic (auth, products, orders, farmers, buyers)
│   │   │   ├── controllers/     # HTTP request handlers
│   │   │   ├── routes/          # API endpoints per feature
│   │   │   ├── middleware/      # Authentication, validation, error handling
│   │   │   └── __tests__/       # Unit and integration tests
│   │   └── openapi.yml          # API documentation
│   │
│   ├── frontend/                # React Vite application
│   │   ├── src/
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── pages/           # Page components (auth, products, orders)
│   │   │   ├── services/        # API client functions
│   │   │   └── __tests__/       # Component tests
│   │
│   └── shared/                  # TypeScript types shared across packages
│
├── docker-compose.yml           # Production stack (Postgres, Backend, Frontend)
├── docker-compose.test.yml      # Feature isolation testing stack
└── .github/workflows/ci.yml     # CI/CD pipeline
```

## Features

### ✅ Authentication
- **Service**: `src/services/authService.ts`
- **Routes**: `src/routes/authRoutes.ts`
- **Endpoints**:
  - `POST /api/auth/register` – Create user account
  - `POST /api/auth/login` – Login and get JWT token
  - `GET /api/auth/profile` – Get current user profile

### ✅ Products
- **Service**: `src/services/productService.ts`
- **Controllers**: `src/controllers/productController.ts`
- **Routes**: `src/routes/productRoutes.ts`
- **Endpoints**:
  - `GET /api/products` – List products (paginated)
  - `GET /api/products/:id` – Get product details
  - `POST /api/products` – Create product (farmer only)
  - `PUT /api/products/:id` – Update product
  - `DELETE /api/products/:id` – Delete product
  - `GET /api/products/search?q=term` – Search products

### ✅ Farmers
- **Service**: `src/services/farmerService.ts`
- **Controllers**: `src/controllers/farmerController.ts`
- **Routes**: `src/routes/farmerRoutes.ts`
- **Endpoints**:
  - `GET /api/farmers` – List farmers (paginated)
  - `GET /api/farmers/:id` – Get farmer profile
  - `GET /api/farmers/profile/me` – Get current farmer profile
  - `POST /api/farmers` – Create farmer profile
  - `PUT /api/farmers/:id` – Update farmer profile

### ✅ Buyers
- **Service**: `src/services/buyerService.ts`
- **Controllers**: `src/controllers/buyerController.ts`
- **Routes**: `src/routes/buyerRoutes.ts`
- **Endpoints**:
  - `GET /api/buyers` – List buyers (paginated)
  - `GET /api/buyers/:id` – Get buyer profile
  - `GET /api/buyers/profile/me` – Get current buyer profile
  - `POST /api/buyers` – Create buyer profile
  - `PUT /api/buyers/:id` – Update buyer profile

### ✅ Orders
- **Service**: `src/services/orderService.ts`
- **Controllers**: `src/controllers/orderController.ts`
- **Routes**: `src/routes/orderRoutes.ts`
- **Endpoints**:
  - `GET /api/orders` – List orders (paginated)
  - `GET /api/orders/my-orders` – Get my orders (buyer)
  - `GET /api/orders/:id` – Get order details
  - `POST /api/orders` – Create new order
  - `PATCH /api/orders/:id/status` – Update order status

---

## Development Workflow

### 1. Local Development with Live Reload

```bash
# Terminal 1: Backend
cd packages/backend
npm run dev

# Terminal 2: Frontend
cd packages/frontend
npm run dev

# Access
# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

### 2. Docker Compose (Production-like)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Stop services
docker compose down
```

### 3. Run Tests

```bash
# Backend unit tests
cd packages/backend
npm run test:unit

# Backend integration tests
npm run test:integration

# All tests with coverage
npm run test
```

### 4. Feature Isolation Testing (Docker)

Run features independently with separate databases:

```bash
docker compose -f docker-compose.test.yml up -d

# Runs auth, products, orders services in isolation
# Each has its own test database (port 5433)
```

---

## Adding a New Feature

### Step 1: Create Service Layer
File: `packages/backend/src/services/newFeatureService.ts`

```typescript
import { query } from '../config/database';

export const getFeatureData = async () => {
  const result = await query('SELECT * FROM new_feature_table');
  return result.rows;
};
```

### Step 2: Create Controller
File: `packages/backend/src/controllers/newFeatureController.ts`

```typescript
import { Request, Response } from 'express';
import * as newFeatureService from '../services/newFeatureService';

export const getFeature = async (req: Request, res: Response) => {
  try {
    const data = await newFeatureService.getFeatureData();
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
```

### Step 3: Create Routes
File: `packages/backend/src/routes/newFeatureRoutes.ts`

```typescript
import { Router } from 'express';
import * as newFeatureController from '../controllers/newFeatureController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.get('/', authMiddleware, newFeatureController.getFeature);
export default router;
```

### Step 4: Register Routes in index.ts

```typescript
import newFeatureRoutes from './routes/newFeatureRoutes';
app.use('/api/new-feature', newFeatureRoutes);
```

### Step 5: Add Database Tables (models/index.ts)

```typescript
export const initializeDatabase = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS new_feature_table (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      data VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
```

### Step 6: Write Tests
File: `packages/backend/src/__tests__/unit/newFeature.test.ts`

```typescript
import * as newFeatureService from '../../services/newFeatureService';

describe('New Feature', () => {
  it('should retrieve feature data', async () => {
    const data = await newFeatureService.getFeatureData();
    expect(data).toBeDefined();
  });
});
```

---

## API Authentication

All protected endpoints require JWT token in header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/products

# Example workflow
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com","password":"securePassword123"}' \
  | jq -r '.token')

curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/farmers/profile/me
```

---

## Scaling Strategy

### Horizontal Scaling
- **Load Balancer**: nginx or HAProxy routes to multiple backend instances
- **Database**: PostgreSQL with read replicas
- **Cache**: Redis for session/product caching

### Example Docker Compose Scale

```bash
# Scale backend to 3 instances
docker compose up -d --scale backend=3
```

### Microservices Architecture (Future)
Each feature can be deployed as separate service:

```
auth-service:5001
products-service:5002
orders-service:5003
farmers-service:5004
buyers-service:5005
```

---

## Monitoring & Logging

### Development Logs
```bash
# Real-time backend logs
docker logs -f etunda_backend

# Frontend dev server output
npm run dev (Terminal shows webpack output)
```

### Production Logging
- Centralized logs: ELK Stack, Datadog, or CloudWatch
- Performance metrics: New Relic, Prometheus
- Error tracking: Sentry

---

## Performance Optimization

### Database
- ✅ Indexes on frequently queried columns (farmer_id, buyer_id, email)
- ✅ Connection pooling (20 max connections)
- ✅ Query logging and monitoring

### Backend
- Add caching layer (Redis) for products/farmers lists
- Implement pagination (limit/offset defaults to 20)
- Use CDN for static assets

### Frontend
- Code splitting with Vite
- Image optimization
- Service worker for offline support

---

## Deployment

### Docker Build
```bash
docker build -t etunda-backend:latest packages/backend
docker build -t etunda-frontend:latest packages/frontend
```

### Push to Registry
```bash
docker tag etunda-backend:latest myregistry/etunda-backend:1.0.0
docker push myregistry/etunda-backend:1.0.0
```

### Production Environment Variables
```env
# Backend
NODE_ENV=production
DB_HOST=prod-db.example.com
DB_USER=etunda_user
JWT_SECRET=<strong-secret-key>
CORS_ORIGIN=https://etunda.com

# Frontend
VITE_API_URL=https://api.etunda.com
```

---

## CI/CD Pipeline (GitHub Actions)

See `.github/workflows/ci.yml` for:
- ✅ Automated testing on every PR
- ✅ Build Docker images
- ✅ Push to registry
- ✅ Deploy to staging
- ✅ Health checks

---

## Troubleshooting

### Backend not connecting to database
```bash
docker logs etunda_postgres
docker exec etunda_postgres psql -U postgres -l
```

### Port conflicts
```bash
# Find process on port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### Tests failing
```bash
cd packages/backend
npm install
npm run test -- --no-coverage
```

---

## Next Steps

1. **Deploy to staging** – Set up staging environment on AWS/GCP
2. **Add frontend pages** – Build React components for each feature
3. **Payment integration** – Stripe or Flutterwave for transactions
4. **Real-time notifications** – WebSockets for order updates
5. **Mobile app** – React Native client
6. **Analytics** – Mixpanel or Amplitude for user behavior

---

**Happy building! 🚀🌱**
