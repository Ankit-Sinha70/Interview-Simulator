'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { abandonSession } from '@/services/api';
import { AlertTriangle, Play, X } from 'lucide-react';

interface ActiveSessionModalProps {
    sessionId: string;
    role: string;
    questionCount: number;
    maxQuestions: number;
    onDismiss: () => void;
}

export default function ActiveSessionModal({
    sessionId,
    role,
    questionCount,
    maxQuestions,
    onDismiss,
}: ActiveSessionModalProps) {
    const router = useRouter();
    const [isAbandoning, setIsAbandoning] = useState(false);

    const handleResume = () => {
        router.push(`/interview/session/${sessionId}`);
        onDismiss();
    };

    const handleQuit = async () => {
        setIsAbandoning(true);
        try {
            await abandonSession(sessionId);
            onDismiss();
        } catch (err) {
            console.error('[ActiveSessionModal] Failed to abandon:', err);
            setIsAbandoning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative max-w-md w-full mx-4 bg-zinc-950 border-2 border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-500/10 p-8 space-y-6 animate-in zoom-in-95 duration-300">
                {/* Icon */}
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>

                {/* Title & Description */}
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-black tracking-tight text-white">
                        Active Interview Detected
                    </h2>
                    <p className="text-amber-500/80 text-[10px] font-black tracking-widest uppercase bg-amber-500/10 py-1 px-3 rounded-full inline-block">
                        Session In Progress
                    </p>
                </div>

                <p className="text-zinc-400 text-sm text-center leading-relaxed">
                    You have an active interview session for{' '}
                    <span className="text-white font-semibold">{role}</span>.
                    You've answered{' '}
                    <span className="text-white font-semibold">{questionCount}/{maxQuestions}</span>{' '}
                    questions. Would you like to resume or quit?
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${(questionCount / maxQuestions) * 100}%` }}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleQuit}
                        disabled={isAbandoning}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-red-900 hover:bg-red-950/30 transition-all text-sm font-semibold disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                        {isAbandoning ? 'Quitting...' : 'Quit Interview'}
                    </button>
                    <button
                        onClick={handleResume}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Play className="w-4 h-4" />
                        Resume Interview
                    </button>
                </div>
            </div>
        </div>
    );
}
