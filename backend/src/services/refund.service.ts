
import Stripe from 'stripe';
import { User } from '../models/user.model';
import { InterviewSessionModel } from '../schemas/interviewSession.schema';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const REFUND_WINDOW_DAYS = 7;
const MAX_INTERVIEWS_FOR_REFUND = 3;

// ─── Eligibility Check ───

export interface RefundEligibility {
    eligible: boolean;
    reason?: string;
    daysSincePurchase?: number;
    interviewsUsed?: number;
}

export async function checkRefundEligibility(userId: string): Promise<RefundEligibility> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Must be a PRO subscriber
    if (user.planType !== 'PRO') {
        return { eligible: false, reason: 'Refunds are only available for PRO plan subscribers.' };
    }

    // One-time refund only
    if (user.refunded) {
        return { eligible: false, reason: 'You have already used your one-time refund.' };
    }

    // Must have a subscription start date
    if (!user.subscriptionStartDate) {
        return { eligible: false, reason: 'Subscription start date is unavailable. Please contact support.' };
    }

    // Check refund window
    const now = new Date();
    const msSincePurchase = now.getTime() - new Date(user.subscriptionStartDate).getTime();
    const daysSincePurchase = Math.floor(msSincePurchase / (1000 * 60 * 60 * 24));

    if (daysSincePurchase > REFUND_WINDOW_DAYS) {
        return {
            eligible: false,
            reason: `Refund window has expired. Refunds are allowed within ${REFUND_WINDOW_DAYS} days of purchase.`,
            daysSincePurchase,
        };
    }

    // Check interview usage since subscription start
    const completedStatuses = ['COMPLETED', 'TIME_EXPIRED', 'MAX_QUESTIONS_REACHED'];
    const interviewsUsed = await InterviewSessionModel.countDocuments({
        userId: userId,
        status: { $in: completedStatuses },
        createdAt: { $gte: user.subscriptionStartDate },
    });

    if (interviewsUsed >= MAX_INTERVIEWS_FOR_REFUND) {
        return {
            eligible: false,
            reason: `Refund is not available after using ${MAX_INTERVIEWS_FOR_REFUND} or more interviews.`,
            daysSincePurchase,
            interviewsUsed,
        };
    }

    // Must have a payment intent to refund
    if (!user.stripePaymentIntentId) {
        return { eligible: false, reason: 'No payment record found. Please contact support.' };
    }

    return { eligible: true, daysSincePurchase, interviewsUsed };
}

// ─── Process Refund ───

export interface RefundResult {
    success: boolean;
    refundAmount?: number;
    message: string;
}

export async function processRefund(userId: string, reason?: string): Promise<RefundResult> {
    // 1. Validate eligibility
    const eligibility = await checkRefundEligibility(userId);
    if (!eligibility.eligible) {
        return { success: false, message: eligibility.reason || 'Not eligible for refund.' };
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Idempotency: prevent double refund if already processing
    if (user.stripeRefundId) {
        return { success: false, message: 'A refund has already been processed for this subscription.' };
    }

    try {
        // 2. Create refund in Stripe
        let refund: Stripe.Refund;
        if (user.stripePaymentIntentId!.startsWith('ch_')) {
            refund = await stripe.refunds.create({
                charge: user.stripePaymentIntentId!,
            });
        } else {
            refund = await stripe.refunds.create({
                payment_intent: user.stripePaymentIntentId!,
            });
        }

        // 3. Cancel the subscription immediately
        if (user.stripeSubscriptionId) {
            try {
                await stripe.subscriptions.cancel(user.stripeSubscriptionId);
            } catch (cancelErr: any) {
                console.warn(`[Refund] Subscription cancel warning (may already be canceled): ${cancelErr.message}`);
            }
        }

        // 4. Update user in DB
        const refundAmountDollars = (refund.amount || 0) / 100;

        user.planType = 'FREE';
        user.subscriptionStatus = 'REFUNDED';
        user.refunded = true;
        user.refundAmount = refundAmountDollars;
        user.refundReason = reason || 'User-initiated refund';
        user.refundDate = new Date();
        user.stripeRefundId = refund.id;
        user.billingCycle = null;
        user.stripeSubscriptionId = undefined;
        user.stripePaymentIntentId = undefined;
        await user.save();

        console.log(`[Refund] Successfully refunded user ${userId} — $${refundAmountDollars}`);

        return {
            success: true,
            refundAmount: refundAmountDollars,
            message: 'Refund processed successfully. Your plan has been downgraded to Free.',
        };
    } catch (err: any) {
        console.error(`[Refund] Stripe refund failed for user ${userId}:`, err.message);
        throw new Error('Failed to process refund. Please try again or contact support.');
    }
}
