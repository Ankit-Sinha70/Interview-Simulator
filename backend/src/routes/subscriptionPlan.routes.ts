import express from 'express';
import * as configController from '../controllers/subscriptionPlan.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = express.Router();

// Public: fetch all active plans
router.get('/', configController.getPlans);

// Admin: seed Base Product and Prices to sync DB + Stripe
router.post('/seed', authenticateToken as any, requireAdmin as any, configController.seedPlans as any);

// Admin: update price of a tier (rolls Stripe ID)
router.post('/update-price', authenticateToken as any, requireAdmin as any, configController.updatePrice as any);

export default router;
