
import Stripe from 'stripe';
import { User } from '../models/user.model';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO || 'price_dummy_123';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

export async function createCheckoutSession(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price: PRICE_ID_PRO,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${CLIENT_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${CLIENT_URL}/pricing`,
        customer_email: user.email,
        metadata: {
            userId: user._id.toString(),
        },
    });

    return session.url;
}

export async function handleWebhook(event: Stripe.Event) {
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;

            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    planType: 'PRO',
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: session.subscription as string,
                    subscriptionStatus: 'ACTIVE',
                });
                console.log(`[Stripe] Upgraded user ${userId} to PRO`);
            }
            break;
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const user = await User.findOne({ stripeSubscriptionId: subscription.id });
            if (user) {
                user.planType = 'FREE';
                user.subscriptionStatus = 'CANCELED';
                await user.save();
                console.log(`[Stripe] Downgraded user ${user._id} to FREE`);
            }
            break;
        }
    }
}


export async function verifySession(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
        const userId = session.metadata?.userId;
        if (userId) {
            await User.findByIdAndUpdate(userId, {
                planType: 'PRO',
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                subscriptionStatus: 'ACTIVE',
            });
            return { success: true, plan: 'PRO' };
        }
    }
    return { success: false };
}

export async function syncSubscriptionStatus(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    let customerId = user.stripeCustomerId;

    // If no customer ID, try finding by email
    if (!customerId) {
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length > 0) {
            customerId = customers.data[0].id;
            user.stripeCustomerId = customerId;
            await user.save();
        }
    }

    if (!customerId) {
        return { success: false, message: 'No Stripe customer found' };
    }

    const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
    });

    if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        user.planType = 'PRO';
        user.stripeSubscriptionId = sub.id;
        user.subscriptionStatus = 'ACTIVE';
        await user.save();
        return { success: true, plan: 'PRO', status: 'UPDATED' };
    } else {
        if (user.planType === 'PRO') {
            user.planType = 'FREE';
            user.subscriptionStatus = 'CANCELED';
            await user.save();
            return { success: true, plan: 'FREE', status: 'DOWNGRADED' };
        }
    }

    return { success: true, plan: user.planType, status: 'NO_CHANGE' };
}
