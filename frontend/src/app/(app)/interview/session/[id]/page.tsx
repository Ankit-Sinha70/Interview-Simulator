'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useActiveSession } from '@/hooks/useActiveSession';
import QuestionCard from '@/components/QuestionCard';
import AnswerInput from '@/components/AnswerInput';
import EvaluationCard from '@/components/EvaluationCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CameraProvider } from '@/components/interview/CameraMonitor/CameraProvider';
import { CameraPreview } from '@/components/interview/CameraMonitor/CameraPreview';
import { PrivacyModal } from '@/components/interview/CameraMonitor/PrivacyModal';
import { useAttention } from '@/components/interview/CameraMonitor/AttentionContext';
import { useInterviewGuard } from '@/hooks/useInterviewGuard';
import { QuitConfirmationModal } from '@/components/interview/QuitConfirmationModal';

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

    // Use our new hook that loads from ID
    const { state, actions } = useActiveSession(sessionId);
    const { status, currentQuestion, questionNumber, latestEvaluation, isSubmitting, error } = state;

    const isInterviewActive = status === 'READY';
    console.log("[Interview] Status:", status, "Active:", isInterviewActive);

    const { showQuitModal, setShowQuitModal, quitInterview, confirmQuit } = useInterviewGuard(isInterviewActive);

    const handleComplete = () => {
        console.log("[Interview] Completing session...");
        actions.complete(stats);
    };

    // Redirect if completed
    useEffect(() => {
        if (status === 'COMPLETED') {
            router.push(`/interview/report/${sessionId}`);
        }
    }, [status, sessionId, router]);

    if (status === 'LOADING') {
        return <div className="flex h-[50vh] items-center justify-center">Loading session...</div>;
    }

    if (error) {
        return <div className="text-destructive p-8">Error: {error}</div>;
    }

    return (
        <>
            <PrivacyModal onEnable={() => console.log("Monitoring enabled")} />
            <CameraPreview />
            <QuitConfirmationModal
                isOpen={showQuitModal}
                onClose={() => setShowQuitModal(false)}
                onConfirm={confirmQuit}
            />

            <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
                {/* Header */}
                <header className="sticky top-4 z-40 bg-background/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <h1 className="text-sm font-bold tracking-tight text-muted-foreground uppercase">Live Session</h1>
                        <Badge variant="outline" className="text-xs border-primary text-primary bg-primary/5">
                            Q{questionNumber}
                        </Badge>
                    </div>
                    <div>
                        <Button
                            size="sm"
                            variant="destructive"
                            id="quit-interview-btn"
                            className="rounded-full h-8 px-4 text-xs font-bold shadow-md z-50 flex items-center gap-2 hover:bg-red-700 transition-colors"
                            onClick={() => {
                                console.log("[Interview] Quit button clicked manually");
                                quitInterview();
                            }}
                            disabled={isSubmitting}
                        >
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            Quit Interview
                        </Button>
                    </div>
                </header>

                {/* DEBUG STATUS BANNER */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="fixed bottom-4 left-4 right-4 flex justify-between items-center bg-black/90 backdrop-blur-sm text-[10px] p-3 rounded-lg border border-zinc-800 z-[99999] text-zinc-400 font-mono shadow-2xl animate-in slide-in-from-bottom-5 duration-500">
                        <div className="flex gap-4">
                            <span>Status: <b className="text-primary">{status}</b></span>
                            <span>Guard Active: <b className={isInterviewActive ? "text-green-500" : "text-red-500"}>{String(isInterviewActive)}</b></span>
                            <span>Session ID: {sessionId.slice(0, 8)}...</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-white border border-zinc-700"
                            >
                                Test Reload
                            </button>
                        </div>
                    </div>
                )}

                {/* Latest Evaluation */}
                {latestEvaluation && (
                    <div className="animate-slide-in-down">
                        <EvaluationCard evaluation={latestEvaluation} questionNumber={questionNumber - 1} />
                    </div>
                )}

                {/* Current Question */}
                {currentQuestion && (
                    <div className="animate-fade-in-up delay-100">
                        <QuestionCard question={currentQuestion} questionNumber={questionNumber} />
                    </div>
                )}

                {/* Input */}
                <div className="space-y-4">
                    <AnswerInput
                        onSubmit={actions.submit}
                        isLoading={isSubmitting}
                    // Voice props can be hooked up later if we expose voice state from hook
                    />
                </div>
            </div>
        </>
    );
}
