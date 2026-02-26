'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getSubscriptionPlans, ISubscriptionPlan } from '@/services/api';

export default function PricingPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
    const [selectedCycle, setSelectedCycle] = useState<string>('MONTHLY');

    useEffect(() => {
        async function fetchPlans() {
            setFetching(true);
            try {
                const plansData = await getSubscriptionPlans();
                if (plansData && plansData.length > 0) {
                    setPlans(plansData);
                    const defaultPlan = plansData.find(p => p.billingCycle === 'QUARTERLY') || plansData[0];
                    setSelectedCycle(defaultPlan.billingCycle);
                }
            } catch (err) {
                console.error('Failed to fetch plans', err);
            } finally {
                setFetching(false);
            }
        }
        fetchPlans();
    }, []);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ billingCycle: selectedCycle }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Failed to start checkout');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030014] text-white pt-24 pb-12 px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed top-0 inset-x-0 h-[500px] bg-gradient-to-b from-violet-500/10 via-transparent to-transparent -z-10" />
            <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 blur-[120px] rounded-full -z-10 mix-blend-screen" />
            <div className="fixed bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full -z-10 mix-blend-screen" />

            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-teal)] bg-clip-text text-transparent mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                        Take your interview prep to the next level. Save more by committing longer.
                    </p>
                </div>

                <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 md:p-8 shadow-2xl relative">
                    {fetching ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-[var(--accent-violet)]" />
                            <p className="text-zinc-400 animate-pulse">Loading pricing options...</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 py-4">
                                {plans.map((plan) => {
                                    const isSelected = selectedCycle === plan.billingCycle;
                                    const monthlyEquivalent = Math.round(plan.price / plan.durationMonths);

                                    // Calculate savings compared to 12x monthly base 
                                    const baseMonthlyPlan = plans.find(p => p.billingCycle === 'MONTHLY');
                                    const baseRate = baseMonthlyPlan ? baseMonthlyPlan.price : 20;
                                    const annualizedCostOfThisPlan = plan.price * (12 / plan.durationMonths);
                                    const annualSavings = (baseRate * 12) - annualizedCostOfThisPlan;

                                    const titleRecord: Record<string, string> = {
                                        'MONTHLY': 'Monthly',
                                        'QUARTERLY': 'Quarterly',
                                        'HALF_YEARLY': 'Half-Yearly',
                                        'YEARLY': 'Yearly'
                                    };

                                    return (
                                        <div
                                            key={plan._id}
                                            onClick={() => setSelectedCycle(plan.billingCycle)}
                                            className={`cursor-pointer rounded-2xl p-6 border relative overflow-hidden transition-all duration-300 ${isSelected ? 'border-[var(--accent-violet)] bg-[var(--accent-violet)]/10 ring-2 ring-[var(--accent-violet)]/50 transform scale-[1.02]' : 'border-border/50 hover:border-border hover:bg-white/5 bg-zinc-900/50'}`}
                                        >
                                            {plan.billingCycle === 'QUARTERLY' && <div className="absolute top-0 right-0 bg-[var(--accent-violet)] text-white text-[11px] uppercase font-bold px-3 py-1.5 rounded-bl-2xl tracking-wider shadow-lg">Popular</div>}
                                            {plan.billingCycle === 'YEARLY' && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[11px] uppercase font-bold px-3 py-1.5 rounded-bl-2xl tracking-wider shadow-lg">Best Value</div>}

                                            <h4 className="font-semibold text-zinc-100 mb-1 text-xl">
                                                {titleRecord[plan.billingCycle]}
                                            </h4>

                                            <div className="flex items-baseline gap-1 mt-3">
                                                <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                                                <span className="text-sm font-medium text-zinc-400">/{plan.durationMonths === 1 ? 'mo' : plan.durationMonths === 12 ? 'yr' : `${plan.durationMonths} mo`}</span>
                                            </div>

                                            <div className="h-14 mt-4 flex flex-col justify-center border-t border-border/50 pt-3">
                                                {plan.durationMonths > 1 ? (
                                                    <>
                                                        <div className="text-sm font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                                            Equivalent to ${monthlyEquivalent}/mo
                                                        </div>
                                                        {annualSavings > 0 && (
                                                            <div className="text-sm text-zinc-400 mt-1">
                                                                You save <span className="text-emerald-400 font-bold">${Math.round(annualSavings)}</span> annually
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-sm text-zinc-400">
                                                        Flexible month-to-month
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 pt-6 border-t border-border/50 flex flex-col items-center">
                                <Button
                                    onClick={handleUpgrade}
                                    disabled={loading}
                                    className="w-full md:w-auto min-w-[300px] h-14 text-lg font-bold bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-teal)] hover:opacity-90 shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all rounded-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Redirecting to Secure Checkout...
                                        </>
                                    ) : 'Continue to Payment'}
                                </Button>
                                <p className="text-xs text-zinc-500 mt-4 flex items-center justify-center gap-1.5">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                                    Payments are securely processed by Stripe.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
