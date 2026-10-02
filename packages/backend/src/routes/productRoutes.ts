import { Router } from 'express';
import * as productController from '../controllers/productController';
import { authMiddleware, optionalAuthMiddleware, roleMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../middleware/schemas';

const router = Router();

router.get('/', optionalAuthMiddleware, productController.getAllProducts);
router.post('/', authMiddleware, roleMiddleware(['farmer']), validate(createProductSchema), productController.createProduct);
router.put('/:id', authMiddleware, roleMiddleware(['farmer']), validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware(['farmer']), productController.deleteProduct);
router.get('/search', optionalAuthMiddleware, productController.searchProducts);
router.get('/:id', optionalAuthMiddleware, productController.getProductById);

export default router;
