import { Router } from 'express';
import * as buyerController from '../controllers/buyerController';
import { authMiddleware, optionalAuthMiddleware, roleMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createBuyerSchema } from '../middleware/schemas';

const router = Router();

router.get('/', optionalAuthMiddleware, buyerController.getAllBuyers);
router.get('/profile/me', authMiddleware, roleMiddleware(['buyer']), buyerController.getMyProfile);
router.get('/:id', optionalAuthMiddleware, buyerController.getBuyerById);
router.post('/', authMiddleware, roleMiddleware(['buyer']), validate(createBuyerSchema), buyerController.createBuyer);
router.put('/:id', authMiddleware, roleMiddleware(['buyer']), buyerController.updateBuyer);

export default router;
