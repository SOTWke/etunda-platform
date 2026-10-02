import { Router } from 'express';
import * as farmerController from '../controllers/farmerController';
import { authMiddleware, optionalAuthMiddleware, roleMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createFarmerSchema } from '../middleware/schemas';

const router = Router();

// Public endpoints
router.get('/', optionalAuthMiddleware, farmerController.getAllFarmers);
router.get('/verified', optionalAuthMiddleware, farmerController.getVerifiedFarmers);
router.get('/search/county', optionalAuthMiddleware, farmerController.searchByCounty);
router.get('/search/category', optionalAuthMiddleware, farmerController.searchByCategory);
router.get('/:id', optionalAuthMiddleware, farmerController.getFarmerById);

// Protected endpoints
router.post('/', authMiddleware, roleMiddleware(['farmer']), validate(createFarmerSchema), farmerController.createFarmer);
router.put('/:id', authMiddleware, roleMiddleware(['farmer']), farmerController.updateFarmer);

// Farm profile endpoints
router.get('/profile/me', authMiddleware, roleMiddleware(['farmer']), farmerController.getMyProfile);
router.post('/farm/profile', authMiddleware, roleMiddleware(['farmer']), farmerController.updateFarmProfile);
router.get('/farm/profile/details', authMiddleware, roleMiddleware(['farmer']), farmerController.getFarmProfile);

export default router;
