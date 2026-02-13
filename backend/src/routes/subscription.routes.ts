
import { Router } from 'express';
import express from 'express';
import * as subscriptionController from '../controllers/subscription.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Protected route to create checkout session
router.post('/create-checkout-session', authenticateToken as any, subscriptionController.createCheckoutSession as any);

// Webhook route (needs raw body, handled in controller or specific middleware if needed)
// Note: app.ts must exclude this from global express.json()
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.webhook as any);

export default router;
