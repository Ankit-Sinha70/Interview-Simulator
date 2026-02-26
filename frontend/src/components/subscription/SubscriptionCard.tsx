'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, Clock, TrendingUp, Zap, Lock, ExternalLink, RotateCcw, Loader2, AlertCircle, XCircle, Undo2, ArrowUpCircle } from 'lucide-react';
import { getMySubscription, createPortalSession, checkRefundEligibility, requestRefund, resumeSubscription, SubscriptionDetails } from '@/services/api';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    ACTIVE: {
        label: 'Active',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/25',
        icon: <CheckCircle className="w-3.5 h-3.5" />,
    },
    PAST_DUE: {
        label: 'Past Due',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/25',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    CANCELED: {
        label: 'Canceled',
        color: 'text-zinc-400',
        bg: 'bg-zinc-700/30',
        border: 'border-zinc-600/25',
        icon: <XCircle className="w-3.5 h-3.5" />,
    },
    REFUNDED: {
        label: 'Refunded',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/25',
        icon: <Undo2 className="w-3.5 h-3.5" />,
    },
};

const PRO_BENEFITS = [
    { text: 'Unlimited interviews', included: true },
    { text: 'Advanced analytics dashboard', included: true },
    { text: 'Focus & attention tracking', included: true },
    { text: 'Priority AI processing', included: true },
    { text: 'Session integrity insights', included: true },
];

const FREE_BENEFITS = [
    { text: '2 interviews per month', included: true },
    { text: 'Basic analytics', included: true },
    { text: 'Advanced analytics dashboard', included: false },
    { text: 'Focus & attention tracking', included: false },
    { text: 'Priority AI processing', included: false },
];

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SubscriptionCard() {
    const [sub, setSub] = useState<SubscriptionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [portalLoading, setPortalLoading] = useState(false);
    const [refundLoading, setRefundLoading] = useState(false);
    const [resumeLoading, setResumeLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { refreshUser } = useAuth();

    useEffect(() => {
        getMySubscription()
            .then(setSub)
            .catch(err => setError(err.message || 'Failed to load subscription'))
            .finally(() => setLoading(false));
    }, []);

    const handleManageBilling = async () => {
        setPortalLoading(true);
        try {
            const { url } = await createPortalSession();
            window.location.href = url;
        } catch (err: any) {
            alert(err.message || 'Could not open billing portal. Please try again.');
        } finally {
            setPortalLoading(false);
        }
    };

    const handleRefund = async () => {
        setRefundLoading(true);
        try {
            const result = await requestRefund('User-initiated refund from settings');
            toast.success(result.message || 'Refund processed successfully!');
            await refreshUser();
            // Reload subscription card data
            const updated = await getMySubscription();
            setSub(updated);
        } catch (err: any) {
            toast.error(err.message || 'Failed to process refund. Please try again.');
        } finally {
            setRefundLoading(false);
        }
    };

    const handleRefundClick = async () => {
        setRefundLoading(true);
        try {
            const eligibility = await checkRefundEligibility();
            if (!eligibility.eligible) {
                toast.error(eligibility.reason || 'You are not eligible for a refund.');
                return;
            }
            // If eligible, the ConfirmDialog will handle showing
            // We set refundLoading false so the dialog button is clickable
        } catch (err: any) {
            toast.error(err.message || 'Could not check refund eligibility.');
        } finally {
            setRefundLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="rounded-2xl bg-card/50 border border-border/50 p-8 flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading subscription…</span>
            </div>
        );
    }

    if (error || !sub) {
        return (
            <div className="rounded-2xl bg-card/50 border border-border/50 p-6 text-center text-muted-foreground text-sm">
                Could not load subscription details.
            </div>
        );
    }

    const statusCfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.ACTIVE;
    const isPro = sub.planType === 'PRO';
    const benefits = isPro ? PRO_BENEFITS : FREE_BENEFITS;

    const getPlanLabel = (cycle?: string | null) => {
        if (!cycle) return '';
        const map: Record<string, string> = {
            'MONTHLY': 'Monthly',
            'QUARTERLY': 'Quarterly',
            'HALF_YEARLY': 'Half-Yearly',
            'YEARLY': 'Yearly'
        };
        return map[cycle] || '';
    };

    const handleResume = async () => {
        try {
            setResumeLoading(true);
            const res = await resumeSubscription();
            if (res.success) {
                toast.success('Subscription resumed successfully!');
                const updated = await getMySubscription();
                setSub(updated);
            } else {
                toast.error('Failed to resume subscription');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'An error occurred');
        } finally {
            setResumeLoading(false);
        }
    };
    // Billing progress
    const daysElapsed = sub.totalDays != null && sub.daysRemaining != null
        ? sub.totalDays - sub.daysRemaining
        : null;
    const progressPct = sub.totalDays && daysElapsed != null
        ? Math.round((daysElapsed / sub.totalDays) * 100)
        : null;

    return (
        <div className="rounded-2xl bg-card/50 border border-border/50 overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between bg-gradient-to-r ${isPro ? 'from-violet-500/10 to-indigo-500/5' : 'from-zinc-800/50 to-zinc-900/30'} border-b border-border/50`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPro ? 'bg-violet-500/15' : 'bg-zinc-700/40'}`}>
                        <CreditCard className={`w-5 h-5 ${isPro ? 'text-violet-400' : 'text-zinc-400'}`} />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Current Plan</p>
                        <h3 className={`text-xl font-black ${isPro ? 'text-violet-300' : 'text-zinc-300'}`}>
                            {isPro ? (sub.billingCycle ? `✦ Pro (${getPlanLabel(sub.billingCycle)})` : '✦ Pro') : 'Free'}
                        </h3>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} border`}>
                    {statusCfg.icon}
                    {statusCfg.label}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Cancel warning */}
                {sub.cancelAtPeriodEnd && sub.currentPeriodEnd && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <p className="text-sm text-amber-300">
                            Your {sub.billingCycle ? `${getPlanLabel(sub.billingCycle)} ` : ''}subscription will <strong>cancel on {formatDate(sub.currentPeriodEnd)}</strong>. You'll retain access until then.
                        </p>
                    </div>
                )}

                {/* Past due warning */}
                {sub.status === 'PAST_DUE' && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <p className="text-sm text-red-300">
                            Payment failed. Please <button onClick={handleManageBilling} className="underline font-semibold">update your billing details</button>.
                        </p>
                    </div>
                )}

                {/* PRO billing info */}
                {isPro && sub.currentPeriodStart && sub.currentPeriodEnd ? (
                    <div className="space-y-4">
                        {/* Date grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-zinc-800/40 rounded-xl p-3.5 border border-zinc-700/40 space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Started On</p>
                                <p className="text-sm font-bold text-white">{formatDate(sub.currentPeriodStart)}</p>
                            </div>
                            <div className="bg-zinc-800/40 rounded-xl p-3.5 border border-zinc-700/40 space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {sub.cancelAtPeriodEnd ? 'Ends On' : 'Renews On'}
                                </p>
                                <p className="text-sm font-bold text-white">{formatDate(sub.currentPeriodEnd)}</p>
                            </div>
                        </div>

                        {/* Billing cycle progress */}
                        {progressPct !== null && sub.daysRemaining !== null && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        <span>Billing Period</span>
                                    </div>
                                    <span className="font-bold text-white">{sub.daysRemaining} days remaining</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>{formatDate(sub.currentPeriodStart)}</span>
                                    <span>{formatDate(sub.currentPeriodEnd)}</span>
                                </div>
                            </div>
                        )}

                        {/* Billing timeline */}
                        <div className="space-y-2">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Billing Timeline</p>
                            <div className="flex items-center gap-3 relative">
                                <div className="flex flex-col items-center gap-1 text-center min-w-[80px]">
                                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                                    <p className="text-[10px] text-zinc-400">{formatDate(sub.currentPeriodStart)}</p>
                                    <p className="text-[10px] text-zinc-500">Started</p>
                                </div>
                                <div className="flex-1 h-px bg-gradient-to-r from-violet-500/50 to-indigo-500/50" />
                                <div className="flex flex-col items-center gap-1 text-center min-w-[80px]">
                                    <div className={`w-2.5 h-2.5 rounded-full ${sub.cancelAtPeriodEnd ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                                    <p className="text-[10px] text-zinc-400">{formatDate(sub.currentPeriodEnd)}</p>
                                    <p className="text-[10px] text-zinc-500">{sub.cancelAtPeriodEnd ? 'Ends' : 'Renews'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : isPro ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                        <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />
                        <p className="text-sm text-violet-300">
                            Your Pro access is active indefinitely. No billing cycle tracked.
                        </p>
                    </div>
                ) : null}

                {/* Usage Stats */}
                <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3" /> Usage This Month
                    </p>
                    <div className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/40">
                        {sub.usage.interviewsLimit === 'UNLIMITED' ? (
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-violet-400" />
                                <span className="text-sm font-bold text-white">Unlimited Interviews</span>
                                <span className="text-xs text-zinc-500">({sub.usage.interviewsUsed} completed this month)</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">Interviews Used</span>
                                    <span className="font-bold text-white">{sub.usage.interviewsUsed} / {sub.usage.interviewsLimit}</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-zinc-700 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${sub.usage.interviewsUsed >= (sub.usage.interviewsLimit as number) ? 'bg-red-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(100, (sub.usage.interviewsUsed / (sub.usage.interviewsLimit as number)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Upgrade Nudge Banner for Monthly Users */}
                        {isPro && sub.billingCycle === 'MONTHLY' && !sub.cancelAtPeriodEnd && sub.status === 'ACTIVE' && (
                            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
                                <div className="flex items-center gap-3">
                                    <ArrowUpCircle className="w-5 h-5 text-violet-400 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-violet-100">Save $72 annually</p>
                                        <p className="text-xs text-violet-300/80">Upgrade to a Yearly plan today.</p>
                                    </div>
                                </div>
                                <Link href="/pricing">
                                    <button className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-500/20 transition-all">
                                        Upgrade
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Plan Benefits */}
                <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Your Plan Includes</p>
                    <div className="space-y-1.5">
                        {benefits.map((b, i) => (
                            <div key={i} className={`flex items-center gap-2.5 text-sm ${b.included ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                {b.included
                                    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    : <Lock className="w-3.5 h-3.5 shrink-0" />
                                }
                                <span className={!b.included ? 'line-through' : ''}>{b.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50">
                    {isPro ? (
                        sub.hasStripeId || sub.currentPeriodStart ? (
                            <>
                                {!sub.cancelAtPeriodEnd && (
                                    <button
                                        onClick={handleManageBilling}
                                        disabled={portalLoading}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 text-sm font-semibold transition-all disabled:opacity-50"
                                    >
                                        {portalLoading
                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            : <ExternalLink className="w-3.5 h-3.5" />
                                        }
                                        Manage Billing
                                    </button>
                                )}
                                {sub.cancelAtPeriodEnd && (
                                    <button
                                        onClick={handleResume}
                                        disabled={resumeLoading}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-sm font-semibold transition-all disabled:opacity-50"
                                    >
                                        {resumeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                        Resume Subscription
                                    </button>
                                )}
                                <button
                                    onClick={handleManageBilling}
                                    disabled={portalLoading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-700/30 hover:bg-zinc-700/50 border border-zinc-600/30 text-zinc-400 text-sm font-semibold transition-all disabled:opacity-50"
                                >
                                    {!sub.cancelAtPeriodEnd && 'Cancel Subscription'}
                                    {sub.cancelAtPeriodEnd && 'Billing Portal'}
                                </button>
                                {/* Refund Button */}
                                {!sub.refunded && (
                                    <ConfirmDialog
                                        title="Request Refund"
                                        description="Refund will cancel your Pro plan immediately. You will lose access to all premium features including unlimited interviews, advanced analytics, and voice mode. This action cannot be undone."
                                        confirmText={refundLoading ? 'Processing…' : 'Yes, Refund Me'}
                                        onConfirm={handleRefund}
                                        destructive
                                    >
                                        <button
                                            onClick={handleRefundClick}
                                            disabled={refundLoading}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-semibold transition-all disabled:opacity-50"
                                        >
                                            {refundLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
                                            Request Refund
                                        </button>
                                    </ConfirmDialog>
                                )}
                            </>
                        ) : (
                            <span className="text-xs text-muted-foreground italic">Billing managed externally</span>
                        )
                    ) : (
                        <Link href="/pricing">
                            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-violet-500/20 transition-all">
                                <Zap className="w-4 h-4" />
                                Upgrade to Pro
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
