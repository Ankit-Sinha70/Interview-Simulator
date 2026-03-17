import React from 'react';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface LockedSectionProps {
    children: React.ReactNode;
    featureLabel: string;
}

export default function LockedSection({ children, featureLabel }: LockedSectionProps) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-white/5 bg-card/30">
            {/* The blurred content underneath */}
            <div className="opacity-40 blur-[6px] pointer-events-none select-none transition-all duration-500">
                {children}
            </div>

            {/* The overlay with the lock and CTA */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-black/40 backdrop-blur-[2px]">
                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                    <Lock className="w-5 h-5 text-violet-400" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                    {featureLabel}
                </h3>
                
                <p className="text-sm text-slate-300 mb-6 max-w-sm">
                    This feature is locked on the Free plan. Upgrade to access full insights and unlimited interviews.
                </p>

                <Link 
                    href="/pricing"
                    className="inline-flex items-center justify-center h-11 px-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                >
                    {featureLabel}
                </Link>
            </div>
        </div>
    );
}
