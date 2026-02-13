
import { Router } from 'express';
import express from 'express';
import * as subscriptionController from '../controllers/subscription.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Protected route to create checkout session
router.post('/create-checkout-session', authenticateToken as any, subscriptionController.createCheckoutSession as any);

router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.webhook as any);

// Manual verification fallback for localhost/failures
router.post('/verify-session', authenticateToken as any, subscriptionController.verifySession as any);
router.post('/sync', authenticateToken as any, subscriptionController.syncSubscription as any);


export default router;
