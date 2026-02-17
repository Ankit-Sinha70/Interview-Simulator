'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useActiveSession } from '@/hooks/useActiveSession';
import QuestionCard from '@/components/QuestionCard';
import AnswerInput from '@/components/AnswerInput';
import EvaluationCard from '@/components/EvaluationCard';
import ScoreBoard from '@/components/ScoreBoard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CameraProvider } from '@/components/interview/CameraMonitor/CameraProvider';
import { CameraPreview } from '@/components/interview/CameraMonitor/CameraPreview';
import { PrivacyModal } from '@/components/interview/CameraMonitor/PrivacyModal';
import { useAttention } from '@/components/interview/CameraMonitor/AttentionContext';
import { useInterviewGuard } from '@/hooks/useInterviewGuard';
import { QuitConfirmationModal } from '@/components/interview/QuitConfirmationModal';
import { Clock, Brain, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Animation for the timer shake
const shakeKeyframes = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }
  .animate-shake {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
  }
`;

/**
 * SessionTimer
 * Synchronized countdown based on backend endsAt
 */
function SessionTimer({
    endsAt,
    onExpire,
    hasShownFiveMinWarning,
    onWarningTrigger
}: {
    endsAt: string | null;
    onExpire: () => void;
    hasShownFiveMinWarning: boolean;
    onWarningTrigger: () => void;
}) {
    const [timeLeft, setTimeLeft] = useState<string>('--:--');
    const [isUrgent, setIsUrgent] = useState(false);
    const triggerRef = React.useRef(hasShownFiveMinWarning);

    // Sync ref with prop if it changes (e.g. on reload)
    useEffect(() => {
        triggerRef.current = hasShownFiveMinWarning;
    }, [hasShownFiveMinWarning]);

    useEffect(() => {
        if (!endsAt) return;

        const target = new Date(endsAt).getTime();

        const update = () => {
            const now = Date.now();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft('00:00');
                onExpire();
                return false;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            const urgent = minutes < 5;
            setIsUrgent(urgent);

            if (urgent && !triggerRef.current) {
                triggerRef.current = true;
                onWarningTrigger();
            }

            setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            return true;
        };

        const hasTime = update();
        if (!hasTime) return;

        const interval = setInterval(() => {
            const continues = update();
            if (!continues) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [endsAt, onExpire, onWarningTrigger]);

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500",
            isUrgent
                ? "bg-red-500/10 border-red-500 text-red-500 animate-pulse animate-shake shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                : "bg-zinc-900/50 border-zinc-800 text-zinc-400"
        )}>
            <style>{shakeKeyframes}</style>
            <Clock className={cn("w-3.5 h-3.5", isUrgent && "animate-bounce")} />
            <span className="text-xs font-mono font-bold tracking-tighter">{timeLeft}</span>
            {isUrgent && (
                <Badge variant="destructive" className="ml-1 px-1 py-0 h-4 text-[8px] font-black animate-in zoom-in">
                    5M WARN
                </Badge>
            )}
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

export default function SessionPage() {
    return (
        <CameraProvider>
            <SessionContent />
        </CameraProvider>
    );
}

function SessionContent() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;
    const { stats } = useAttention();
    const [showWarningModal, setShowWarningModal] = useState(false);

    // Use our new hook that loads from ID
    const { state, actions } = useActiveSession(sessionId);
    const { status, currentQuestion, questionNumber, latestEvaluation, isSubmitting, error, endsAt, maxQuestions, sessionEnded } = state;

    const isInterviewActive = status === 'READY' && !sessionEnded;
    console.log("[Interview] Status:", status, "Active:", isInterviewActive, "Ended:", sessionEnded);

    const { showQuitModal, setShowQuitModal, quitInterview, confirmQuit } = useInterviewGuard(isInterviewActive);

    const handleComplete = useCallback(() => {
        // Now handled entirely by backend/SessionEnded modal
        console.log("[Interview] Auto-completing session (Time up)...");
    }, []);

    // Manual redirection now for scoreboard
    const handleViewReport = useCallback(() => {
        router.push(`/interview/report/${sessionId}`);
    }, [router, sessionId]);

    if (status === 'LOADING') {
        return <div className="flex h-[50vh] items-center justify-center">Loading session...</div>;
    }

    if (error) {
        return <div className="text-destructive p-8 text-center bg-background min-h-screen">
            <h2 className="text-xl font-bold mb-2">Session Error</h2>
            <p className="opacity-70 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>;
    }

    return (
        <>
            {/* 5-MINUTE WARNING MODAL */}
            {showWarningModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <Card className="max-w-md w-full p-8 border-2 border-red-600 shadow-2xl text-center space-y-6 bg-zinc-950">
                        <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-10 h-10 text-red-600 animate-bounce" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black tracking-tight text-white">5 Minutes Remaining</h2>
                            <p className="text-red-500 uppercase text-[10px] font-black tracking-widest bg-red-500/10 py-1 px-3 rounded-full inline-block">
                                Final Warning
                            </p>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Your interview session is nearly over. Please wrap up your current thoughts and prepare for final questions.
                        </p>
                        <Button
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-xl transition-all"
                            onClick={() => setShowWarningModal(false)}
                        >
                            I Understand, Continue
                        </Button>
                    </Card>
                </div>
            )}

            <PrivacyModal onEnable={() => console.log("Monitoring enabled")} />
            <CameraPreview />
            <QuitConfirmationModal
                isOpen={showQuitModal}
                onClose={() => setShowQuitModal(false)}
                onConfirm={confirmQuit}
            />

            {/* UNMISSABLE ACTIVE GUARD INDICATOR */}
            {isInterviewActive && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
                    <div className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold shadow-xl border-2 border-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        EXIT PROTECTION ACTIVE
                    </div>
                </div>
            )}

            {/* EMERGENCY FIXED QUIT BUTTON - In case header is hidden */}
            <div className="fixed top-4 right-4 z-[100]">
                <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-full shadow-2xl h-10 px-6 font-bold border-2 border-white/20 hover:scale-105 active:scale-95 transition-all"
                    onClick={() => {
                        console.log("[Interview] Fixed Quit button clicked");
                        quitInterview();
                    }}
                >
                    Quit Interview
                </Button>
            </div>

            <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
                {/* Header */}
                <header className="sticky top-4 z-40 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                            <h1 className="text-xs font-black tracking-[0.2em] text-zinc-500 uppercase">Live Session</h1>
                        </div>

                        <div className="h-4 w-[1px] bg-zinc-800" />

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-zinc-300">
                                <Brain className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold">Progress</span>
                                <Badge variant="secondary" className="font-mono text-[10px] bg-zinc-900 border-zinc-800">
                                    {questionNumber} / 10
                                </Badge>
                            </div>

                            <SessionTimer
                                endsAt={endsAt}
                                onExpire={handleComplete}
                                hasShownFiveMinWarning={state.hasShownFiveMinWarning}
                                onWarningTrigger={() => {
                                    console.log("[Interview] 5-minute warning triggered!");
                                    setShowWarningModal(true);
                                    import('@/services/api').then(api => api.markWarningTriggered(sessionId));
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-[10px] text-zinc-500 font-mono mr-2">
                            {status}
                        </div>
                    </div>
                </header>

                {/* DEBUG STATUS BANNER */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="fixed bottom-4 left-4 right-4 flex justify-between items-center bg-black/95 backdrop-blur-xl text-[10px] p-3 rounded-lg border border-red-900/30 z-[99999] text-zinc-400 font-mono shadow-2xl animate-in slide-in-from-bottom-5 duration-500">
                        <div className="flex gap-4">
                            <span>Status: <b className="text-primary">{status}</b></span>
                            <span>Guard: <b className={isInterviewActive ? "text-green-500" : "text-red-500"}>{String(isInterviewActive)}</b></span>
                            <span>Q: {questionNumber}/{maxQuestions}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded text-white border border-zinc-800 text-[9px]"
                            >
                                RELOAD
                            </button>
                        </div>
                    </div>
                )}

                {/* Latest Evaluation (Hidden during session per user request) */}
                {latestEvaluation && sessionEnded && (
                    <div className="animate-slide-in-down">
                        <EvaluationCard evaluation={latestEvaluation} questionNumber={questionNumber} />
                    </div>
                )}

                {/* Current Question */}
                {currentQuestion && !sessionEnded && (
                    <div className="animate-fade-in-up delay-100">
                        <QuestionCard question={currentQuestion} questionNumber={questionNumber} />
                    </div>
                )}

                {/* End of Session ScoreBoard */}
                {sessionEnded && (
                    <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                        <ScoreBoard
                            history={state.history}
                            aggregated={state.aggregatedScores}
                            onViewReport={handleViewReport}
                        />
                    </div>
                )}

                {/* Input */}
                {!sessionEnded && (
                    <div className="space-y-4 animate-fade-in-up delay-200">
                        <AnswerInput
                            onSubmit={actions.submit}
                            isLoading={isSubmitting}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
