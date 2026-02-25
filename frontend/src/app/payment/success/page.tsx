'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import Confetti from 'react-confetti';

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');
    const { refreshUser } = useAuth();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }, []);

    useEffect(() => {
        if (!sessionId) {
            setStatus('error');
            return;
        }

        const verifyPayment = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/verify-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ sessionId }),
                });

                const data = await res.json();
                if (data.success) {
                    // Refetch the user so AuthContext updates to PRO immediately
                    await refreshUser();
                    setStatus('success');
                } else {
                    setStatus('error');
                }
            } catch (err) {
                console.error('Failed to verify session:', err);
                setStatus('error');
            }
        };

        verifyPayment();
    }, [sessionId, refreshUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a] p-4 relative overflow-hidden shadow-2xl shadow-orange-900">
            {/* Dynamic Mesh Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
                <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] bg-[var(--accent-teal)]/20 rounded-full blur-[90px]" />
            </div>

            {status === 'success' && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.15}
                    className="z-50"
                />
            )}

            <div className="w-full max-w-4xl mx-auto relative z-10">
                <Card className="bg-[#111116]/90 backdrop-blur-2xl border border-zinc-800/80 shadow-xl shadow-blue-900 overflow-hidden rounded-3xl grid grid-cols-1 md:grid-cols-2 animate-fade-in-up">

                    {/* Left Side: Ticket Receipt */}
                    <div className="relative flex flex-col justify-center border-b md:border-b-0 md:border-r border-dashed border-zinc-700/60 p-8 md:p-12">
                        {/* Cutout Effects - Now on the dividing line between columns */}
                        <div className="hidden md:block absolute top-0 -right-4 w-8 h-8 bg-[#0a0a1a] rounded-full -translate-y-1/2 z-20" />
                        <div className="hidden md:block absolute bottom-0 -right-4 w-8 h-8 bg-[#0a0a1a] rounded-full translate-y-1/2 z-20" />

                        <div className="text-center mb-10">
                            {status === 'loading' ? (
                                <div className="flex flex-col items-center justify-center py-6">
                                    <div className="w-20 h-20 bg-[var(--accent-violet)]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[var(--accent-violet)]/30 box-shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                                        <Loader2 className="w-10 h-10 text-[var(--accent-violet)] animate-spin" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 text-white">Verifying Payment...</h2>
                                    <p className="text-zinc-400 text-sm">Please wait while we confirm.</p>
                                </div>
                            ) : status === 'success' ? (
                                <>
                                    <div className="w-24 h-24 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-2 ring-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-zoom-in">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                                        Payment Successful!
                                    </h2>
                                    <p className="text-zinc-500 text-sm tracking-wider uppercase font-medium">
                                        Transaction: <span className="text-zinc-300 font-mono">{sessionId?.slice(0, 16) || 'PRO-SUCCESS-2026'}</span>
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="w-24 h-24 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-2 ring-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-zoom-in">
                                        <span className="text-4xl">⚠️</span>
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                                        Verification Failed
                                    </h2>
                                    <p className="text-zinc-500 text-sm tracking-wider uppercase font-medium">
                                        Status: <span className="text-zinc-300 font-mono">ERROR</span>
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50">
                            {status === 'success' ? (
                                <>
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-400 font-medium">Plan Description</span>
                                            <span className="font-bold text-zinc-100">Pro (Monthly)</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-400 font-medium">Amount Paid</span>
                                            <span className="font-bold text-emerald-400 text-base">$12.00</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-400 font-medium">Benefits</span>
                                            <span className="font-bold text-[var(--accent-teal)]">Unlimited AI Interviews</span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => router.push('/')}
                                        className="w-full bg-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/90 text-white font-bold h-14 rounded-xl transition-all shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] text-lg"
                                    >
                                        Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </>
                            ) : status === 'error' ? (
                                <>
                                    <p className="text-zinc-400 text-sm text-center mb-8 leading-relaxed">
                                        We couldn't automatically verify your payment at this exact moment. If you were charged, your account will be upgraded shortly.
                                    </p>
                                    <Button
                                        onClick={() => router.push('/')}
                                        variant="outline"
                                        className="w-full h-14 rounded-xl border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white font-bold text-base"
                                    >
                                        Return to Dashboard
                                    </Button>
                                </>
                            ) : (
                                <div className="h-40 animate-pulse bg-zinc-800/30 rounded-xl" />
                            )}
                        </div>
                    </div>

                    {/* Right Side: Illustration */}
                    <div className="hidden md:flex flex-col justify-center items-center bg-[#111116]/90 p-12">
                        <img
                            src="https://illustrations.popsy.co/amber/freelancer.svg"
                            alt="Success Celebration"
                            className="w-full max-w-[320px] drop-shadow-3xl opacity-90 hover:scale-105 transition-transform duration-700"
                            style={{ filter: "drop-shadow(0px 20px 40px rgba(20, 238, 165, 1))" }}
                        />
                        {status === 'success' && (
                            <p className="mt-8 text-zinc-400 text-center text-sm font-medium animate-fade-in delay-500">
                                You are now ready to ace your interviews.
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
                <Loader2 className="w-12 h-12 text-[var(--accent-violet)] animate-spin" />
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}
