
import Stripe from 'stripe';
import { User } from '../models/user.model';
import { SubscriptionPlan } from '../models/subscriptionPlan.model';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const CLIENT_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

export async function createCheckoutSession(userId: string, billingCycle: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY' = 'MONTHLY', couponCode?: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const plan = await SubscriptionPlan.findOne({ billingCycle, isActive: true });
    if (!plan) throw new Error(`Active pricing plan for ${billingCycle} is not configured.`);

    const sessionParams: any = {
        line_items: [
            {
                price: plan.stripePriceId,
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
    };

    if (couponCode) {
        sessionParams.discounts = [{ coupon: couponCode }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return session.url;
}

export async function resumeSubscription(userId: string) {
    const user = await User.findById(userId);
    if (!user || user.planType !== 'PRO' || !user.stripeSubscriptionId) {
        throw new Error('No active manageable subscription found');
    }

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false,
    });

    await User.findByIdAndUpdate(userId, { subscriptionStatus: 'ACTIVE' });

    return { success: true, status: 'ACTIVE' };
}

export async function handleWebhook(event: Stripe.Event) {
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;

            if (userId) {
                const updateData: any = {
                    planType: 'PRO',
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: session.subscription as string,
                    subscriptionStatus: 'ACTIVE',
                    subscriptionStartDate: new Date(),
                    hasEverSubscribed: true,
                    hasSeenWelcomeOffer: true,
                };

                // Store payment intent for potential future refunds
                if (session.payment_intent) {
                    updateData.stripePaymentIntentId = session.payment_intent as string;
                } else if (session.subscription) {
                    // For subscriptions, fetch the latest invoice's payment intent
                    try {
                        const sub = await stripe.subscriptions.retrieve(session.subscription as string, {
                            expand: ['latest_invoice'],
                        });
                        const invoice = sub.latest_invoice as any;
                        if (invoice?.payment_intent) {
                            updateData.stripePaymentIntentId = invoice.payment_intent as string;
                        } else if (invoice?.charge) {
                            updateData.stripePaymentIntentId = invoice.charge as string;
                        } else {
                            // Fallback: get the customer's most recent payment intent
                            const intents = await stripe.paymentIntents.list({
                                customer: session.customer as string,
                                limit: 1
                            });
                            if (intents.data.length > 0) {
                                updateData.stripePaymentIntentId = intents.data[0].id;
                            }
                        }
                    } catch (e) {
                        console.warn('[Stripe] Could not fetch payment_intent from subscription invoice:', e);
                    }
                }

                await User.findByIdAndUpdate(userId, updateData);
                console.log(`[Stripe] Upgraded user ${userId} to PRO`);
            }
            break;
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const user = await User.findOne({ stripeSubscriptionId: subscription.id });
            if (user) {
                // Don't overwrite REFUNDED status
                if (user.subscriptionStatus !== 'REFUNDED') {
                    user.planType = 'FREE';
                    user.subscriptionStatus = 'CANCELED';
                    await user.save();
                    console.log(`[Stripe] Downgraded user ${user._id} to FREE`);
                }
            }
            break;
        }
        case 'charge.refunded': {
            const charge = event.data.object as Stripe.Charge;
            const paymentIntentId = charge.payment_intent as string;
            if (paymentIntentId) {
                const user = await User.findOne({ stripePaymentIntentId: paymentIntentId });
                if (user && user.subscriptionStatus !== 'REFUNDED') {
                    user.planType = 'FREE';
                    user.subscriptionStatus = 'REFUNDED';
                    user.refunded = true;
                    user.refundDate = new Date();
                    await user.save();
                    console.log(`[Stripe] Reconciled refund for user ${user._id} via charge.refunded webhook`);
                }
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
            let billingCycle: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY' | null = null;
            if (session.subscription) {
                try {
                    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
                    const interval = sub.items?.data?.[0]?.plan?.interval;
                    const interval_count = sub.items?.data?.[0]?.plan?.interval_count;

                    if (interval === 'year') {
                        billingCycle = 'YEARLY';
                    } else if (interval === 'month') {
                        if (interval_count === 1) billingCycle = 'MONTHLY';
                        else if (interval_count === 3) billingCycle = 'QUARTERLY';
                        else if (interval_count === 6) billingCycle = 'HALF_YEARLY';
                    }
                } catch (e) {
                    console.error('[Subscription] Could not fetch interval during verifySession:', e);
                }
            }

            const verifyUpdate: any = {
                planType: 'PRO',
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                subscriptionStatus: 'ACTIVE',
                billingCycle,
                subscriptionStartDate: new Date(),
            };

            // Store payment intent for refund support
            console.log(`[Subscription] verifySession: session.payment_intent=`, session.payment_intent);
            if (session.payment_intent) {
                verifyUpdate.stripePaymentIntentId = session.payment_intent as string;
            } else if (session.subscription) {
                try {
                    const subObj = await stripe.subscriptions.retrieve(session.subscription as string, {
                        expand: ['latest_invoice'],
                    });
                    const inv = subObj.latest_invoice as any;
                    if (inv?.payment_intent) {
                        verifyUpdate.stripePaymentIntentId = inv.payment_intent as string;
                    } else if (inv?.charge) {
                        verifyUpdate.stripePaymentIntentId = inv.charge as string;
                    } else {
                        // Fallback: get the customer's most recent payment intent
                        const intents = await stripe.paymentIntents.list({
                            customer: session.customer as string,
                            limit: 1
                        });
                        if (intents.data.length > 0) {
                            verifyUpdate.stripePaymentIntentId = intents.data[0].id;
                        } else {
                            console.log(`[Subscription] No payment intents found for customer ${session.customer}`);
                        }
                    }
                } catch (e) {
                    console.warn('[Subscription] Could not fetch payment_intent during verifySession:', e);
                }
            }

            await User.findByIdAndUpdate(userId, verifyUpdate);
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
