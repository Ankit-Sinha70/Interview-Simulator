import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import * as subscriptionService from '../services/subscription.service';
import * as refundService from '../services/refund.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function createCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { billingCycle } = req.body;
        const validCycles = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'];
        const validCycle = validCycles.includes(billingCycle) ? billingCycle : 'MONTHLY';

        const url = await subscriptionService.createCheckoutSession(userId, validCycle as any);
        res.json({ url });
    } catch (error) {
        next(error);
    }
}

export async function webhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
        if (!endpointSecret || !sig) {
            throw new Error('Missing webhook secret or signature');
        }

        // Ensure body is a Buffer for signature verification
        let body = req.body;
        if (!Buffer.isBuffer(body)) {
            // If body is NOT a buffer (e.g. string or object), try to convert it or fail
            // However, with express.raw({type: 'application/json'}), it SHOULD be a buffer.
            // If it's a string, we can use Buffer.from
            if (typeof body === 'string') {
                body = Buffer.from(body, 'utf-8');
            } else {
                // Fallback or error
            }
        }

        event = stripe.webhooks.constructEvent(body, sig as string, endpointSecret);
    } catch (err: any) {
        console.error(`[Stripe] Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    try {
        await subscriptionService.handleWebhook(event);
        res.json({ received: true });
    } catch (err: any) {
        console.error(`[Stripe] Handler Error: ${err.message}`);
        res.status(500).send('Handler failed');
    }
}
export async function verifySession(req: Request, res: Response, next: NextFunction) {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ error: 'Session ID required' });
            return;
        }
        const result = await subscriptionService.verifySession(sessionId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
}

export async function syncSubscription(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        const result = await subscriptionService.syncSubscriptionStatus(userId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
}

export async function getMySubscription(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const data = await subscriptionService.getSubscriptionDetails(userId);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
}

export async function createPortalSession(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const url = await subscriptionService.createPortalSession(userId);
        res.json({ success: true, data: { url } });
    } catch (error) {
        next(error);
    }
}

export async function checkRefundEligibility(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const result = await refundService.checkRefundEligibility(userId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
}

export async function requestRefund(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const { reason } = req.body;
        const result = await refundService.processRefund(userId, reason);
        if (!result.success) {
            res.status(400).json({ success: false, error: { message: result.message } });
            return;
        }
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
}

export async function resumeSubscription(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const result = await subscriptionService.resumeSubscription(userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}
