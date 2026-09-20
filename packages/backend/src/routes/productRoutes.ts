import { Router } from 'express';
import * as productController from '../controllers/productController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../middleware/schemas';

const router = Router();

router.get('/', optionalAuthMiddleware, productController.getAllProducts);
router.post('/', authMiddleware, validate(createProductSchema), productController.createProduct);
router.get('/search', optionalAuthMiddleware, productController.searchProducts);
router.get('/:id', optionalAuthMiddleware, productController.getProductById);
router.put('/:id', authMiddleware, validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

export default router;
