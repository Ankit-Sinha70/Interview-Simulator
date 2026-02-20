
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
        success_url: `${CLIENT_URL}/?session_id={CHECKOUT_SESSION_ID}`,
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

// ─── Subscription Details (for Transparency UI) ───

export async function getSubscriptionDetails(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.checkReset();

    const base = {
        planType: user.planType,
        status: user.subscriptionStatus,
        usage: {
            interviewsUsed: user.interviewsUsedThisMonth,
            interviewsLimit: user.planType === 'PRO' ? 'UNLIMITED' : 2,
        },
    };

    // PRO: fetch live billing data from Stripe
    if (user.stripeSubscriptionId) {
        try {
            const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId) as unknown as Stripe.Subscription;

            const periodStart = new Date((sub as any).current_period_start * 1000);
            const periodEnd = new Date((sub as any).current_period_end * 1000);
            const now = new Date();
            const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));

            const stripeStatus = ((sub as any).status as string).toUpperCase() as 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
            if (['ACTIVE', 'CANCELED', 'PAST_DUE'].includes(stripeStatus) && user.subscriptionStatus !== stripeStatus) {
                user.subscriptionStatus = stripeStatus;
                await user.save();
            }

            return {
                ...base,
                status: stripeStatus,
                currentPeriodStart: periodStart.toISOString(),
                currentPeriodEnd: periodEnd.toISOString(),
                daysRemaining,
                totalDays,
                cancelAtPeriodEnd: (sub as any).cancel_at_period_end as boolean,
            };
        } catch (err) {
            console.error('[Subscription] Stripe fetch failed:', err);
        }
    }

    return {
        ...base,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        daysRemaining: null,
        totalDays: null,
        cancelAtPeriodEnd: false,
    };
}

export async function createPortalSession(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (!user.stripeCustomerId) throw new Error('No Stripe customer found for this user');

    const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${CLIENT_URL}/settings`,
    });

    return session.url;
}
