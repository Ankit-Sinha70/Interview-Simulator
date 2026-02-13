import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import * as subscriptionService from '../services/subscription.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function createCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const url = await subscriptionService.createCheckoutSession(userId);
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
