
import Stripe from 'stripe';
import { User } from '../models/user.model';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO || 'price_dummy_123';
const PRICE_ID_PRO_ANNUAL = process.env.STRIPE_PRICE_ID_PRO_ANNUAL;
const CLIENT_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

export async function createCheckoutSession(userId: string, billingCycle: 'MONTHLY' | 'ANNUAL' = 'MONTHLY') {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    let priceId = PRICE_ID_PRO;
    if (billingCycle === 'ANNUAL') {
        if (!PRICE_ID_PRO_ANNUAL) throw new Error('Annual pricing is not configured on this server.');
        priceId = PRICE_ID_PRO_ANNUAL;
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${CLIENT_URL}/payment/cancel`,
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
            let billingCycle: 'MONTHLY' | 'ANNUAL' | null = null;
            if (session.subscription) {
                try {
                    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
                    const interval = sub.items?.data?.[0]?.plan?.interval;
                    if (interval === 'year') billingCycle = 'ANNUAL';
                    else if (interval === 'month') billingCycle = 'MONTHLY';
                } catch (e) {
                    console.error('[Subscription] Could not fetch interval during verifySession:', e);
                }
            }

            await User.findByIdAndUpdate(userId, {
                planType: 'PRO',
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                subscriptionStatus: 'ACTIVE',
                billingCycle,
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
        billingCycle: user.billingCycle,
        usage: {
            interviewsUsed: user.interviewsUsedThisMonth,
            interviewsLimit: user.planType === 'PRO' ? 'UNLIMITED' : 2,
        },
    };

    // PRO: fetch live billing data from Stripe
    if (user.stripeSubscriptionId && user.stripeSubscriptionId !== 'null' && user.stripeSubscriptionId !== 'undefined') {
        try {
            const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId) as unknown as Stripe.Subscription;

            const pStart = (sub as any).current_period_start || sub.items?.data?.[0]?.current_period_start || (sub as any).start_date;
            const pEnd = (sub as any).current_period_end || sub.items?.data?.[0]?.current_period_end || (pStart ? pStart + 30 * 24 * 60 * 60 : null);

            let periodStartStr: string | null = null;
            let periodEndStr: string | null = null;
            let daysRemaining: number | null = null;
            let totalDays: number | null = null;

            if (pStart && pEnd) {
                const sDate = new Date(pStart * 1000);
                const eDate = new Date(pEnd * 1000);
                periodStartStr = sDate.toISOString();
                periodEndStr = eDate.toISOString();

                const now = new Date();
                daysRemaining = Math.max(0, Math.ceil((eDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                totalDays = Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24));
            } else {
                console.warn(`[Subscription] stripeSubscriptionId ${user.stripeSubscriptionId} returned object without billing periods.`, sub);
            }

            const stripeStatus = ((sub as any).status as string).toUpperCase() as 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
            if (['ACTIVE', 'CANCELED', 'PAST_DUE'].includes(stripeStatus) && user.subscriptionStatus !== stripeStatus) {
                user.subscriptionStatus = stripeStatus;
                await user.save();
            }

            return {
                ...base,
                status: stripeStatus,
                currentPeriodStart: periodStartStr,
                currentPeriodEnd: periodEndStr,
                daysRemaining,
                totalDays,
                cancelAtPeriodEnd: (sub as any).cancel_at_period_end as boolean || false,
                hasStripeId: true,
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
