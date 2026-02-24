"use client";

import React from "react";
import { useAttention } from "./AttentionContext";

export function PrivacyModal({ onEnable }: { onEnable: () => void }) {
    const { isMonitoring, setIsMonitoring } = useAttention();
    const [isOpen, setIsOpen] = React.useState(true);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>

                <h2 className="text-xl font-bold text-white mb-2">Enable Interview Monitoring?</h2>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                    We use AI to help you track eye contact and focus during your interview.
                    <span className="block mt-2 font-medium text-zinc-300 italic">
                        ✔ Camera is processed locally in your browser. <br />
                        ✔ No video or audio is ever stored or uploaded.
                    </span>
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={() => { setIsMonitoring(false); setIsOpen(false); }}
                        className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Skip
                    </button>
                    <button
                        onClick={() => { setIsMonitoring(true); setIsOpen(false); onEnable(); }}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-secondary/90 text-white rounded-lg font-medium shadow-lg shadow-secondary/20 transition-colors"
                    >
                        Enable
                    </button>
                </div>

                <p className="mt-4 text-[10px] text-zinc-500 text-center uppercase tracking-widest">
                    Results are advisory only
                </p>
            </div>
        </div>
    );
}
