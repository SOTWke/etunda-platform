import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../middleware/schemas';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(['admin']), orderController.getAllOrders);
router.get('/my-orders', authMiddleware, roleMiddleware(['buyer']), orderController.getMyOrders);
router.get('/farmer', authMiddleware, roleMiddleware(['farmer']), orderController.getFarmerOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.post('/', authMiddleware, roleMiddleware(['buyer']), validate(createOrderSchema), orderController.createOrder);
router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware(['buyer', 'farmer']),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);
router.post('/:id/accept', authMiddleware, roleMiddleware(['farmer']), orderController.acceptOrder);
router.post('/:id/reject', authMiddleware, roleMiddleware(['farmer']), orderController.rejectOrder);

export default router;
