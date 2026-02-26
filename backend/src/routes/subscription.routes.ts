
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

// Subscription transparency
router.get('/me', authenticateToken as any, subscriptionController.getMySubscription as any);
router.post('/create-portal-session', authenticateToken as any, subscriptionController.createPortalSession as any);

// Refund routes
router.get('/refund-eligibility', authenticateToken as any, subscriptionController.checkRefundEligibility as any);
router.post('/request-refund', authenticateToken as any, subscriptionController.requestRefund as any);

export default router;
