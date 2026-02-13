'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useActiveSession } from '@/hooks/useActiveSession';
import QuestionCard from '@/components/QuestionCard';
import AnswerInput from '@/components/AnswerInput';
import EvaluationCard from '@/components/EvaluationCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SessionPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    // Use our new hook that loads from ID
    const { state, actions } = useActiveSession(sessionId);
    const { status, currentQuestion, questionNumber, history, latestEvaluation, isSubmitting, error } = state;

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
                        className="rounded-full h-8 text-xs"
                        onClick={actions.complete}
                        disabled={isSubmitting}
                    >
                        Finish Early
                    </Button>
                </div>
            </header>

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
    );
}
