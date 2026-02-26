'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { dismissWelcomeOffer } from '@/services/api';
import { Sparkles, Zap, BarChart3, Mic, Eye, Clock, X } from 'lucide-react';

interface WelcomeOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    expiresAt: string | null;
    savings: number | null;
    onUpgrade: () => void;
}

function useCountdown(expiresAt: string | null) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!expiresAt) return;
        const target = new Date(expiresAt).getTime();

        const tick = () => {
            const now = Date.now();
            const diff = Math.max(0, target - now);
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    return timeLeft;
}

export default function WelcomeOfferModal({ isOpen, onClose, expiresAt, savings, onUpgrade }: WelcomeOfferModalProps) {
    const [show, setShow] = useState(false);
    const [dismissing, setDismissing] = useState(false);
    const [upgrading, setUpgrading] = useState(false);
    const countdown = useCountdown(expiresAt);

    useEffect(() => {
        if (isOpen) {
            // Small delay for entrance animation
            const t = setTimeout(() => setShow(true), 50);
            return () => clearTimeout(t);
        } else {
            setShow(false);
        }
    }, [isOpen]);

    const handleDismiss = useCallback(async () => {
        setDismissing(true);
        try {
            await dismissWelcomeOffer();
        } catch (e) {
            console.error('Failed to dismiss welcome offer:', e);
        }
        setShow(false);
        setTimeout(onClose, 300);
    }, [onClose]);

    const handleUpgrade = useCallback(async () => {
        setUpgrading(true);
        onUpgrade();
    }, [onUpgrade]);

    if (!isOpen && !show) return null;

    const features = [
        { icon: Zap, label: 'Unlimited interviews', color: '#a78bfa' },
        { icon: BarChart3, label: 'Advanced analytics & insights', color: '#60a5fa' },
        { icon: Mic, label: 'Voice answer evaluation', color: '#34d399' },
        { icon: Eye, label: 'Focus & attention tracking', color: '#f472b6' },
    ];

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{ backgroundColor: 'rgba(5, 3, 15, 0.85)', backdropFilter: 'blur(12px)' }}
        >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-500/15 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-cyan-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-pink-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div
                className={`relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 shadow-2xl transition-all duration-500 ${show ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}`}
                style={{
                    background: 'linear-gradient(180deg, rgba(24, 18, 50, 0.98) 0%, rgba(12, 10, 28, 0.99) 100%)',
                    boxShadow: '0 0 80px rgba(109, 90, 230, 0.15), 0 0 40px rgba(109, 90, 230, 0.1), 0 25px 50px rgba(0,0,0,0.5)',
                }}
            >
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Top glow line */}
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 0%, #6d5ae6 30%, #8877ff 50%, #6d5ae6 70%, transparent 100%)' }} />

                {/* Content */}
                <div className="px-8 pt-8 pb-7">
                    {/* Badge */}
                    <div className="flex justify-center mb-5">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10">
                            <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
                            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Limited-Time Welcome Offer</span>
                        </div>
                    </div>

                    {/* Heading */}
                    <h2 className="text-center text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
                        Welcome to AI Interview Simulator!
                    </h2>
                    <p className="text-center text-slate-400 text-sm mb-6">
                        You&apos;ve unlocked an exclusive new-member discount
                    </p>

                    {/* Discount Card */}
                    <div
                        className="relative rounded-2xl p-5 mb-6 border border-violet-500/20 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, rgba(109, 90, 230, 0.12) 0%, rgba(88, 80, 180, 0.08) 100%)' }}
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/10 rounded-full blur-[40px]" />
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-1">Yearly Plan</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-extrabold text-white">30%</span>
                                    <span className="text-lg font-bold text-violet-300">OFF</span>
                                </div>
                                {savings && (
                                    <div className="mt-1 text-emerald-400 text-sm font-semibold">
                                        💰 Save ₹{savings.toLocaleString()} instantly
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1.5 text-amber-400/90 text-xs font-medium mb-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    Offer expires in
                                </div>
                                <div className="font-mono text-2xl font-bold text-white tracking-wider">
                                    {countdown || '--:--:--'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-3 mb-7">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05] transition-all"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${f.color}15` }}>
                                    <f.icon className="h-4 w-4" style={{ color: f.color }} />
                                </div>
                                <span className="text-xs font-medium text-slate-300 leading-tight">{f.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <Button
                        onClick={handleUpgrade}
                        disabled={upgrading}
                        className="w-full h-12 text-[15px] font-bold rounded-xl transition-all duration-300 border-0"
                        style={{
                            background: 'linear-gradient(135deg, #6d5ae6 0%, #8877ff 50%, #6d5ae6 100%)',
                            backgroundSize: '200% 200%',
                            animation: 'shimmer 3s ease-in-out infinite',
                            boxShadow: '0 4px 20px rgba(109, 90, 230, 0.4), 0 0 40px rgba(109, 90, 230, 0.15)',
                        }}
                    >
                        {upgrading ? (
                            <span className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Redirecting...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Upgrade Now — Save {savings ? `₹${savings.toLocaleString()}` : '30%'}
                            </span>
                        )}
                    </Button>

                    <button
                        onClick={handleDismiss}
                        disabled={dismissing}
                        className="w-full mt-3 py-2.5 text-sm text-slate-500 hover:text-slate-300 font-medium transition-colors"
                    >
                        {dismissing ? 'Closing...' : 'Maybe Later'}
                    </button>
                </div>
            </div>

            {/* Shimmer keyframe */}
            <style jsx global>{`
                @keyframes shimmer {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        </div>
    );
}
