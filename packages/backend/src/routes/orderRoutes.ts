import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, orderController.getAllOrders);
router.get('/my-orders', authMiddleware, orderController.getMyOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.post('/', authMiddleware, orderController.createOrder);
router.patch('/:id/status', authMiddleware, orderController.updateOrderStatus);

export default router;
