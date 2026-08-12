# eTunda Sprint 2 - Visual Architecture & Component Map

---

## CURRENT SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ETUNDA PLATFORM                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐          ┌─────────────────────────────┐    │
│  │   FRONTEND       │          │      BACKEND (Express)      │    │
│  │   (React/Vite)   │◄────────►│      Port 5000              │    │
│  └──────────────────┘          └─────────────────────────────┘    │
│         Port 3000                           │                      │
│                                             │                      │
│  Pages (2):                                 ├─ Controllers (6)     │
│  - /login                                   ├─ Services (6)        │
│  - /products                                ├─ Middleware (auth)   │
│                                             ├─ Routes (6)          │
│  Stores (1):                                │                      │
│  - authStore.ts                             │                      │
│                                             ▼                      │
│  Services (2):                         ┌─────────────────┐         │
│  - api.ts                              │  PostgreSQL 16  │         │
│  - stripe.ts (stub)                    │  Port 5432      │         │
│                                        │                 │         │
│                                        │ Tables: 5       │         │
│                                        │ Indexes: 4      │         │
│                                        └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## WORKFLOW: FARMER → BUYER → ORDER (INCOMPLETE)

```
FARMER FLOW                          BUYER FLOW
┌─────────────────────┐             ┌──────────────────────┐
│   Register/Login    │             │   Register/Login     │
└──────────┬──────────┘             └──────────┬───────────┘
           │                                   │
           ▼                                   │
    ┌─────────────────┐                       │
    │ Farmer Profile  │                       │
    └────────┬────────┘                       │
             │                                │
             ▼                                │
    ┌─────────────────┐                       │
    │ Create Product  │  ❌ MISSING: images, units,
    │ - name          │       harvest date, quality
    │ - price         │
    │ - quantity      │  ┌────────────────────────────┐
    │ - category      │  │                            │
    └────────┬────────┘  │   ✅ WORKS                │
             │           │                            │
             ▼           │  PRODUCTS MARKETPLACE      │
      ┌──────────────┐   │  ✅ List products         │
      │   Product    │   │  ✅ Search products       │
      │  Published   │───►  ❌ BROKEN: route order   │
      └──────────────┘   │                            │
                         │  ❌ MISSING:               │
                         │   - Product detail page    │
                         │   - Add to cart           │
                         │   - Cart display          │
                         │   - Checkout flow         │
                         └────────────┬───────────────┘
                                      │
                         ❌ MISSING: Cart system
                                      │
                         ❌ MISSING: Checkout form
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │   Create Order          │
                         │  ❌ BUG: req.user.buyerId
                         │  ❌ BUG: No validation
                         │  ❌ BUG: No inventory dec
                         │  ❌ BUG: Price hardcoded
                         └────────┬────────────────┘
                                  │
                    ❌ MISSING: Order confirmation
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │   Farmer Receives Order    │
                    │  ❌ MISSING: Dashboard     │
                    │  ❌ MISSING: Notifications│
                    └────────┬───────────────────┘
                             │
                    ❌ MISSING: Accept/Reject UI
                             │
                             ▼
                    ┌────────────────────────────┐
                    │   Order Processing         │
                    │  ❌ MISSING: Status updates│
                    │  ❌ MISSING: Workflow UI   │
                    └────────┬───────────────────┘
                             │
                    ❌ MISSING: Order complete
                             │
                             ▼
                    ┌────────────────────────────┐
                    │   Buyer Receives/Confirms  │
                    │  ❌ MISSING: Dashboard     │
                    │  ❌ MISSING: Order tracking│
                    └────────────────────────────┘
```

---

## DATABASE SCHEMA (CURRENT)

```
users (10 records)
├─ id: UUID PK
├─ email: VARCHAR UNIQUE ✅
├─ password: HASHED ✅
├─ role: farmer|buyer|admin ✅
└─ created_at, updated_at ✅
   INDEX: idx_users_email ✅

farmers (2 records)
├─ id: UUID PK
├─ user_id: FK UNIQUE → users ✅
├─ name ✅
├─ location ✅
├─ phone ✅
├─ bio ✅
├─ rating ✅
└─ ❌ MISSING: farm_name, county, coordinates, categories

buyers (0 records)
├─ id: UUID PK
├─ user_id: FK UNIQUE → users ✅
├─ name ✅
├─ location ✅
├─ phone ✅
├─ rating ✅
└─ ❌ MINIMAL: no business fields

products (1 record)
├─ id: UUID PK ✅
├─ farmer_id: FK → farmers ✅
├─ name ✅
├─ description ✅
├─ price ✅
├─ quantity ✅
├─ category ✅
├─ created_at, updated_at ✅
└─ ❌ MISSING: images, unit, harvest_date, quality, status
   INDEX: idx_products_farmer_id ✅

orders (0 records)
├─ id: UUID PK ✅
├─ buyer_id: FK → buyers ✅
├─ product_id: FK → products ✅
├─ quantity ✅
├─ total_price ✅
├─ status ✅
└─ created_at, updated_at ✅
   INDEXES: idx_orders_buyer_id, idx_orders_product_id ✅

❌ MISSING TABLES:
├─ cart_items
├─ order_items (for multi-product orders)
├─ payments
├─ product_images
├─ reviews
└─ notifications
```

---

## API ENDPOINTS (CURRENT STATE)

```
✅ WORKING:
─────────────────────────────────────────
GET    /api/auth/profile              (protected)
POST   /api/auth/register
POST   /api/auth/login
GET    /api/farmers                   (paginated)
GET    /api/farmers/:id
GET    /api/farmers/profile/me        (protected)
POST   /api/farmers                   (protected)
PUT    /api/farmers/:id               (protected)
GET    /api/buyers                    (paginated)
GET    /api/buyers/:id
GET    /api/buyers/profile/me         (protected)
POST   /api/buyers                    (protected)
PUT    /api/buyers/:id                (protected)
GET    /api/products                  (paginated) ✅
GET    /api/products/:id              ✅
POST   /api/products                  (farmer-only) ✅
PUT    /api/products/:id              ✅
DELETE /api/products/:id              ✅

❌ BROKEN:
─────────────────────────────────────────
GET    /api/products/search?q=...     (route bug - returns 404)
                                      (fix: move after /:id)

⚠️  INCOMPLETE:
─────────────────────────────────────────
GET    /api/orders                    (needs permission check)
GET    /api/orders/:id                (needs validation)
GET    /api/orders/my-orders          (BUG: req.user.buyerId)
POST   /api/orders                    (BUG: no validation, no inventory)
PATCH  /api/orders/:id/status         (needs transition rules)

❌ MISSING:
─────────────────────────────────────────
GET    /api/cart                      (not implemented)
POST   /api/cart/items                (not implemented)
PUT    /api/cart/items/:id            (not implemented)
DELETE /api/cart/items/:id            (not implemented)
POST   /api/checkout                  (not implemented)
POST   /api/payments                  (stub only)
GET    /api/products/:id/detail       (merged into /:id)
GET    /api/farmers/:id/products      (not implemented)
PATCH  /api/orders/:id/accept         (not implemented)
PATCH  /api/orders/:id/reject         (not implemented)
```

---

## FRONTEND ROUTES (CURRENT)

```
✅ WORKING:
────────────────
/login      → LoginPage (register + login)
/products   → ProductsPage (list + search)

❌ MISSING:
────────────────
/dashboard
/dashboard/farmer
/dashboard/farmer/products
/dashboard/farmer/products/create
/dashboard/farmer/products/:id/edit
/dashboard/farmer/orders
/dashboard/farmer/orders/:id
/dashboard/buyer
/dashboard/buyer/orders
/dashboard/buyer/orders/:id
/product/:id (detail page)
/cart
/checkout
/profile
/logout (implicit)

❌ COMPONENTS MISSING:
────────────────
- Navigation/Navbar
- Product Detail Page
- Cart Display
- Checkout Form
- Farmer Dashboard
- Buyer Dashboard
- Order Details Page
- Order Tracking
- Admin Panel
```

---

## IMPLEMENTATION ROADMAP

```
WEEK 1: Foundation (Bug Fixes + Schema)
├─ Day 1: Fix 5 critical bugs ............................ 1d
├─ Day 2: Expand database schema ......................... 2d
└─ Day 3: Database transactions wrapper ................. 1d
   Subtotal: 4 days ✅

WEEK 2: Core Marketplace Transaction
├─ Day 1-2: Cart system (backend + frontend) ........... 2d
├─ Day 1: Checkout workflow + form ..................... 2d
├─ Day 1-2: Order creation + validation ............... 2d
├─ Day 1: Farmer order dashboard ....................... 1.5d
├─ Day 1: Buyer order dashboard ........................ 1.5d
└─ Day 1: Navigation + routing .......................... 2d
   Subtotal: 12 days ✅

WEEK 3: Testing & Hardening
├─ Day 1: Integration tests ............................ 2d
├─ Day 1: End-to-end tests ............................ 1d
├─ Day 1: Security audit .............................. 1d
├─ Day 1: Performance testing ......................... 1d
└─ Day 1: Bug fixes + refinement ...................... 2d
   Subtotal: 7 days ✅

TOTAL: ~23 days (3 weeks) with 2 engineers
```

---

## DEPENDENCIES MATRIX

```
                    ┌─────────────────────────────────┐
                    │   Fix Critical Bugs             │
                    │   (Order + Routes)              │
                    └─────────────┬───────────────────┘
                                  │
                    ┌─────────────▼───────────────────┐
                    │   Expand Database Schema        │
                    │   (Add missing fields/tables)   │
                    └─────────────┬───────────────────┘
                                  │
                    ┌─────────────▼───────────────────┐
                    │   Cart System                   │
                    │   (Backend + Frontend)          │
                    └─────────────┬───────────────────┘
                                  │
                    ┌─────────────▼───────────────────┐
                    │   Checkout Workflow             │
                    │   (Form + Validation)           │
                    └─────────────┬───────────────────┘
                                  │
                    ┌─────────────▼───────────────────┐
                    │   Order Management              │
                    │   (Dashboards + Tracking)       │
                    └─────────────┬───────────────────┘
                                  │
                    ┌─────────────▼───────────────────┐
                    │   Complete Navigation           │
                    │   (All routes + pages)          │
                    └─────────────┬───────────────────┘
                                  │
                    ┌─────────────▼───────────────────┐
                    │   Testing & Hardening           │
                    │   (Tests + Security)            │
                    └─────────────────────────────────┘
```

---

## FILES TO MODIFY (PRIORITY)

### 🔴 CRITICAL (Fix First)

```
packages/backend/src/
├── controllers/orderController.ts       (Line 12: fix req.user.buyerId)
├── routes/productRoutes.ts              (Fix route order)
├── services/orderService.ts             (Add inventory logic)
└── controllers/orderController.ts       (Add price validation)
```

### 🟠 HIGH (Phase A)

```
packages/backend/src/
├── middleware/auth.ts                   (Role checking)
├── models/index.ts                      (Expand schema)
├── config/database.ts                   (Add transactions)
└── services/productService.ts           (Pagination for search)
```

### 🟡 MEDIUM (Phase B-C)

```
packages/backend/src/
├── services/cartService.ts              (NEW)
├── controllers/cartController.ts        (NEW)
├── routes/cartRoutes.ts                 (NEW)
├── services/checkoutService.ts          (NEW)
└── controllers/checkoutController.ts    (NEW)

packages/frontend/src/
├── pages/                               (6 new pages)
├── stores/cartStore.ts                  (NEW)
├── components/                          (8+ new components)
└── pages/DashboardLayout.tsx            (NEW)
```

---

## SECURITY CHECKLIST

```
✅ JWT token validation
✅ Bcrypt password hashing
✅ CORS configured
✅ Helmet security headers
✅ Parameterized SQL queries
✅ Input validation framework ready (Joi)

⚠️  Role-based authorization (incomplete)
⚠️  Request rate limiting (not implemented)
⚠️  CSRF protection (not implemented)
⚠️  SQL injection (protected but can improve)
⚠️  XSS protection (depends on React)

❌ Payment security (not started)
❌ File upload security (no uploads yet)
❌ API key rotation (no keys yet)
❌ Audit logging (not implemented)
```

---

## TESTING COVERAGE TARGETS

```
Current: ~10% coverage
Target:  70% coverage

Breakdown:
├── Unit Tests (40%): Services
├── Integration Tests (30%): APIs
├── E2E Tests (20%): Complete workflows
└── Security Tests (10%): Authorization, input validation
```

---

**This map is a living document. Update as Sprint 2 progresses.**

