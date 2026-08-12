# eTunda Sprint 2 - Critical Bug Fixes (Ready to Apply)

**Priority**: 🔴 MUST FIX BEFORE PROCEEDING  
**Estimated Time**: ~4 hours to fix and test all 5 bugs

---

## BUG #1: Order Creation Fails (req.user.buyerId undefined)

**Severity**: 🔴 CRITICAL  
**Location**: `packages/backend/src/controllers/orderController.ts`  
**Status**: Blocks all order creation

### Current Code (BROKEN):

```typescript
export const createOrder = async (req: Request, res: Response) => {
  try {
    const buyerId = (req as any).user?.buyerId;  // ❌ WRONG - JWT doesn't have buyerId

    if (!buyerId) {
      return res.status(403).json({ error: 'Buyer profile required' });
    }

    const { productId, quantity } = req.body;
    // ... rest of function
```

### Problem:
- JWT token contains: `{id, email, role}`
- Code looks for: `req.user.buyerId` (undefined)
- Result: All orders fail with "Buyer profile required"

### Fixed Code:

```typescript
import * as buyerService from '../services/buyerService';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get buyer profile from userId
    let buyer;
    try {
      buyer = await buyerService.getBuyerByUserId(userId);
    } catch (error) {
      return res.status(403).json({ error: 'Buyer profile required. Please create a buyer profile first.' });
    }

    const buyerId = buyer.id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    const order = await orderService.createOrder(buyerId, productId, quantity, 0); // totalPrice will be calculated
    res.status(201).json({ data: order });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
```

### Testing:
```bash
# Create a buyer first
curl -X POST http://localhost:5000/api/buyers \
  -H "Authorization: Bearer <FARMER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Buyer","location":"Kenya","phone":"+254..."}'

# Then try to create an order
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <BUYER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"productId":"<PRODUCT_ID>","quantity":5}'

# Should return 201 Created (not 403 Forbidden)
```

---

## BUG #2: Product Search Returns 404

**Severity**: 🔴 CRITICAL  
**Location**: `packages/backend/src/routes/productRoutes.ts`  
**Status**: Search endpoint broken

### Current Code (BROKEN):

```typescript
const router = Router();

router.get('/', optionalAuthMiddleware, productController.getAllProducts);
router.get('/search', optionalAuthMiddleware, productController.searchProducts);  // ❌ Comes BEFORE /:id
router.get('/:id', optionalAuthMiddleware, productController.getProductById);     // ❌ This matches /search
router.post('/', authMiddleware, productController.createProduct);
// ...
```

### Problem:
- Express matches routes in order
- Request to `/search` is caught by `/:id` (search treated as ID)
- Results in "Product not found" 404

### Fixed Code:

```typescript
const router = Router();

router.get('/', optionalAuthMiddleware, productController.getAllProducts);
router.post('/', authMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);
router.get('/search', optionalAuthMiddleware, productController.searchProducts);  // ✅ Comes AFTER :id
router.get('/:id', optionalAuthMiddleware, productController.getProductById);     // ✅ This is now last

export default router;
```

### Testing:
```bash
# Search should now work
curl "http://localhost:5000/api/products/search?q=tomato"

# Should return 200 OK with results (not 404)
```

---

## BUG #3: Inventory Not Decremented

**Severity**: 🔴 CRITICAL  
**Location**: `packages/backend/src/services/orderService.ts`  
**Status**: Stock not tracked, multiple people can order same units

### Current Code (BROKEN):

```typescript
export const createOrder = async (buyerId: string, productId: string, quantity: number, totalPrice: number): Promise<Order> => {
  const result = await query(
    `INSERT INTO orders (buyer_id, product_id, quantity, total_price, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [buyerId, productId, quantity, totalPrice]
  );

  return result.rows[0];  // ❌ Product quantity never decremented
};
```

### Problem:
- When order created, product quantity unchanged
- 500 units available → order 100 units → still shows 500
- 10 people can each order 100 units = 1000 ordered, 500 available = oversold

### Fixed Code (Part 1 - Add validation):

```typescript
import * as productService from './productService';

export const createOrder = async (buyerId: string, productId: string, quantity: number, totalPrice: number): Promise<Order> => {
  // ✅ Validate product exists and has stock
  const product = await productService.getProductById(productId);
  
  if (product.quantity < quantity) {
    throw new Error(`Insufficient stock. Available: ${product.quantity}, Requested: ${quantity}`);
  }

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  // ✅ Create order
  const result = await query(
    `INSERT INTO orders (buyer_id, product_id, quantity, total_price, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [buyerId, productId, quantity, totalPrice]
  );

  // ✅ Decrement product quantity
  await query(
    `UPDATE products SET quantity = quantity - $1 WHERE id = $2`,
    [quantity, productId]
  );

  return result.rows[0];
};
```

### Testing:
```bash
# Get product stock
curl http://localhost:5000/api/products/1 | grep quantity
# Returns: "quantity": 500

# Create order for 100 units
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"productId":"1","quantity":100}'

# Check stock again
curl http://localhost:5000/api/products/1 | grep quantity
# Should return: "quantity": 400 (✅ decremented)
```

---

## BUG #4: Order Price Hardcoded (No Validation)

**Severity**: 🔴 CRITICAL  
**Location**: `packages/backend/src/controllers/orderController.ts`  
**Status**: Price can be manipulated by frontend

### Current Code (BROKEN):

```typescript
export const createOrder = async (req: Request, res: Response) => {
  try {
    // ...
    const { productId, quantity } = req.body;

    // ❌ Hardcoded price - trusts frontend
    const totalPrice = quantity * 100; // Placeholder
    
    const order = await orderService.createOrder(buyerId, productId, quantity, totalPrice);
    res.status(201).json({ data: order });
```

### Problem:
- Frontend could send `quantity=1, totalPrice=1` for expensive item
- Backend trusts frontend price
- **Security vulnerability**: Buyer can pay less than actual cost

### Fixed Code:

```typescript
export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let buyer;
    try {
      buyer = await buyerService.getBuyerByUserId(userId);
    } catch (error) {
      return res.status(403).json({ error: 'Buyer profile required' });
    }

    const buyerId = buyer.id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Product ID and quantity required' });
    }

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Quantity must be positive integer' });
    }

    // ✅ Fetch actual product price from database
    const product = await productService.getProductById(productId);
    
    // ✅ Recalculate total price server-side
    const totalPrice = Number((product.price * quantity).toFixed(2));

    const order = await orderService.createOrder(buyerId, productId, quantity, totalPrice);
    res.status(201).json({ data: order });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
  }
};
```

### Testing:
```bash
# Try to create order with fake price
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"productId":"1","quantity":5,"totalPrice":1}'  # Tries to set price to 1

# Verify backend calculated correct price
curl http://localhost:5000/api/orders/123 | grep total_price
# Should show: "total_price": 400 (5 * 80, not 1) ✅
```

---

## BUG #5: No Role Authorization Checks

**Severity**: 🟠 HIGH  
**Location**: `packages/backend/src/controllers/farmerController.ts` and `buyerController.ts`  
**Status**: Authorization bypass

### Current Code (BROKEN):

```typescript
// packages/backend/src/controllers/farmerController.ts
export const createFarmer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;  // ❌ No role check

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, location, phone, bio } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // ❌ Any authenticated user (buyer, admin) can create farmer profile
    const farmer = await farmerService.createFarmer(userId, name, location || '', phone || '', bio || '');
    res.status(201).json({ data: farmer });
```

### Problem:
- Buyer user logs in and creates farmer profile too
- Admin can create profiles for any role
- One user can have multiple roles
- Data integrity compromised

### Fixed Code (Farmer):

```typescript
import { roleMiddleware } from '../middleware/auth';

export const createFarmer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;  // ✅ Get role from JWT

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ✅ Only farmers can create farmer profiles
    if (role !== 'farmer') {
      return res.status(403).json({ error: 'Only farmers can create farmer profiles' });
    }

    // ✅ Check if farmer profile already exists
    try {
      await farmerService.getFarmerByUserId(userId);
      return res.status(409).json({ error: 'Farmer profile already exists' });
    } catch (error) {
      // Profile doesn't exist, continue
    }

    const { name, location, phone, bio } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const farmer = await farmerService.createFarmer(userId, name, location || '', phone || '', bio || '');
    res.status(201).json({ data: farmer });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
```

### Also Update Routes (Farmer):

```typescript
import { roleMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthMiddleware, farmerController.getAllFarmers);
router.get('/profile/me', authMiddleware, farmerController.getMyProfile);
router.get('/:id', optionalAuthMiddleware, farmerController.getFarmerById);
router.post('/', authMiddleware, roleMiddleware(['farmer']), farmerController.createFarmer);  // ✅ Add role check
router.put('/:id', authMiddleware, roleMiddleware(['farmer']), farmerController.updateFarmer);  // ✅ Add role check

export default router;
```

### Same for Buyers:

```typescript
// In buyerController.ts - same pattern
// In buyerRoutes.ts - add roleMiddleware(['buyer'])
```

### Testing:
```bash
# Try to create farmer profile as buyer (should fail)
curl -X POST http://localhost:5000/api/farmers \
  -H "Authorization: Bearer <BUYER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Fake Farmer","location":"Kenya"}'

# Should return 403 Forbidden (✅)

# Create farmer profile as farmer (should work)
curl -X POST http://localhost:5000/api/farmers \
  -H "Authorization: Bearer <FARMER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Real Farmer","location":"Kenya"}'

# Should return 201 Created (✅)
```

---

## SUMMARY OF FIXES

| Bug | File | Lines | Fix Time | Impact |
|-----|------|-------|----------|--------|
| #1 | orderController.ts | 12-15 | 30min | Orders now work |
| #2 | productRoutes.ts | 4-7 | 10min | Search works |
| #3 | orderService.ts | 3-15 | 45min | Stock tracked |
| #4 | orderController.ts | 8-10 | 45min | Price validated |
| #5 | farmerController, buyerController | Multiple | 60min | Authorization enforced |

**Total Time**: ~3 hours

---

## APPLICATION ORDER

Apply fixes in this order:

1. **Fix #2** (route order) - 10 minutes
   - Smallest change, verify search works
   - Builds confidence

2. **Fix #1** (order creation) - 30 minutes
   - Unlocks order functionality
   - Test with any product

3. **Fix #4** (price validation) - 45 minutes
   - Depends on #1
   - Prevents security issue

4. **Fix #3** (inventory) - 45 minutes
   - Depends on #1 and #4
   - Complete order flow

5. **Fix #5** (authorization) - 60 minutes
   - Independent changes
   - Improves security

---

## VERIFICATION CHECKLIST

After applying all fixes, verify:

- [ ] Search endpoint returns products (not 404)
- [ ] Can create order without "Buyer profile required" error
- [ ] Order price matches product price × quantity
- [ ] Product quantity decreases after order
- [ ] Cannot create farmer profile as buyer
- [ ] Cannot create buyer profile as farmer
- [ ] Farmer can create farmer profile
- [ ] Buyer can create buyer profile
- [ ] All existing tests pass
- [ ] No new errors in logs

---

**Ready to apply these fixes. Notify when approval given.**

