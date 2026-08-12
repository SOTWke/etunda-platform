import { Router } from 'express';
import * as buyerController from '../controllers/buyerController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthMiddleware, buyerController.getAllBuyers);
router.get('/profile/me', authMiddleware, buyerController.getMyProfile);
router.get('/:id', optionalAuthMiddleware, buyerController.getBuyerById);
router.post('/', authMiddleware, buyerController.createBuyer);
router.put('/:id', authMiddleware, buyerController.updateBuyer);

export default router;
