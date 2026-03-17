import React, { useState, useEffect } from 'react';
import { Sparkles, X, Infinity, Lock, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InterviewLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    interviewsUsed: number;
    limit: number;
}

export default function InterviewLimitModal({ isOpen, onClose, interviewsUsed, limit }: InterviewLimitModalProps) {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div 
                className="relative w-full max-w-[480px] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Graphic */}
                <div className="h-32 bg-gradient-to-br from-violet-600/20 via-indigo-600/20 to-slate-900 flex items-center justify-center border-b border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
                    <div className="w-16 h-16 rounded-full bg-violet-600/30 border border-violet-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)] z-10">
                        <Lock className="w-8 h-8 text-violet-400" />
                    </div>
                </div>

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/20 text-slate-400 hover:text-white hover:bg-black/40 transition-colors z-20"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="p-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                            Free Limit Reached
                        </h2>
                        <p className="text-slate-300 text-[15px]">
                            You've used all {limit} of your free interviews for this month.
                        </p>
                    </div>

                    {/* Feature Comparison */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-400">Current Plan</span>
                            <span className="text-sm font-bold text-white bg-slate-700 px-3 py-1 rounded-full">Free</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-300">Interviews used</span>
                            <span className="text-red-400 font-bold">{interviewsUsed} / {limit}</span>
                        </div>
                        
                        <div className="h-px w-full bg-slate-700/50" />
                        
                        <div className="space-y-3 pt-1">
                            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Unlock With Pro
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-slate-200">
                                <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">✓</div>
                                <span>Unlimited AI interviews</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-200">
                                <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">✓</div>
                                <span>Detailed performance breakdowns</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-200">
                                <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">✓</div>
                                <span>AI answer improvement suggestions</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-200">
                                <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">✓</div>
                                <span>Focus & attention tracking</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button 
                            onClick={() => router.push('/pricing')}
                            className="w-full flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                        >
                            <Infinity className="w-5 h-5" />
                            Unlock Unlimited Interviews
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                        
                        <button 
                            onClick={onClose}
                            className="w-full h-11 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Come Back Next Month
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
