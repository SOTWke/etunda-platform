import { Router } from 'express';
import * as productController from '../controllers/productController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthMiddleware, productController.getAllProducts);
router.post('/', authMiddleware, productController.createProduct);
router.get('/search', optionalAuthMiddleware, productController.searchProducts);  // ✅ AFTER :id routes
router.get('/:id', optionalAuthMiddleware, productController.getProductById);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

export default router;
