import { Router } from 'express';
import * as buyerController from '../controllers/buyerController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createBuyerSchema } from '../middleware/schemas';

const router = Router();

router.get('/', optionalAuthMiddleware, buyerController.getAllBuyers);
router.get('/profile/me', authMiddleware, buyerController.getMyProfile);
router.get('/:id', optionalAuthMiddleware, buyerController.getBuyerById);
router.post('/', authMiddleware, validate(createBuyerSchema), buyerController.createBuyer);
router.put('/:id', authMiddleware, buyerController.updateBuyer);

export default router;
