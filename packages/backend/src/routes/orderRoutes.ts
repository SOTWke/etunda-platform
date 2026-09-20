import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../middleware/schemas';

const router = Router();

router.get('/', authMiddleware, orderController.getAllOrders);
router.get('/my-orders', authMiddleware, orderController.getMyOrders);
router.get('/farmer', authMiddleware, orderController.getFarmerOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.post('/', authMiddleware, validate(createOrderSchema), orderController.createOrder);
router.patch(
  '/:id/status',
  authMiddleware,
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);
router.post('/:id/accept', authMiddleware, orderController.acceptOrder);
router.post('/:id/reject', authMiddleware, orderController.rejectOrder);

export default router;
