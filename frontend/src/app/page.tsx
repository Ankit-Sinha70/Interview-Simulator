'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import SessionSetup from '@/components/SessionSetup';
import QuestionCard from '@/components/QuestionCard';
import AnswerInput from '@/components/AnswerInput';
import VoiceInput from '@/components/VoiceInput';
import EvaluationCard from '@/components/EvaluationCard';
import ReportView from '@/components/ReportView';
import { useInterviewSession } from '@/hooks/useInterviewSession';

export default function Home() {
  const { state, actions } = useInterviewSession();
  const { status, currentQuestion, questionNumber, history, latestEvaluation, finalReport, isLoading, error, voice } = state;

  // ─── Layout Components ───
  const ErrorBanner = error ? (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-in-down w-[90%] max-w-lg">
      <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground px-4 py-3 rounded-xl shadow-lg flex items-center justify-between backdrop-blur-md">
        <span className="flex items-center gap-2 text-sm font-medium">⚠️ {error}</span>
        <button onClick={actions.dismissError} className="hover:bg-destructive/20 rounded-full p-1 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {ErrorBanner}

      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-30">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-[var(--accent-violet)]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-[var(--accent-teal)]/20 rounded-full blur-[100px]" />
      </div>

      {status === 'SELECT_ROLE' && (
        <main className="flex-1 flex flex-col items-center justify-center">
          <SessionSetup onStart={actions.start} isLoading={isLoading} />
        </main>
      )}

      {status === 'COMPLETED' && finalReport && (
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <ReportView report={finalReport} onNewSession={actions.reset} />
        </main>
      )}

      {status === 'INTERVIEW_ACTIVE' && (
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">

          {/* Top Navbar */}
          <header className="sticky top-4 z-40 bg-background/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-sm px-4 py-3 mb-8 flex items-center justify-between animate-slide-in-down">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" title="Live" />
              <h1 className="text-sm font-bold tracking-tight text-muted-foreground uppercase">Interview Session</h1>
              <Badge variant="outline" className="text-xs border-[var(--accent-violet)] text-[var(--accent-violet)] bg-[var(--accent-violet)]/5">
                Q{questionNumber}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* Phase 2: Voice Integration
              <Button
                variant="ghost"
                size="sm"
                onClick={actions.toggleVoice}
                className={`rounded-full text-xs font-semibold h-8 transition-colors ${voice.isListening
                  ? 'text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 hover:bg-[var(--accent-teal)]/20'
                  : 'text-muted-foreground hover:bg-muted'
                  }`}
              >
                {voice.isListening ? '🎤 Voice Active' : '🔇 Voice Off'}
              </Button>
              */}

              {history.length >= 1 && (
                <Button
                  size="sm"
                  onClick={actions.complete}
                  disabled={isLoading}
                  className="rounded-full text-xs font-bold h-8 bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent transition-all"
                >
                  {isLoading ? '...' : 'Finish'}
                </Button>
              )}
            </div>
          </header>

          <div className="space-y-6">
            {/* Latest Evaluation (Feedback) */}
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

            {/* Inputs */}
            <div className="space-y-4">
              {/* Phase 2: Voice Input
              {voice.isListening && (
                <div className="animate-zoom-in">
                   <VoiceInput onTranscript={actions.setVoiceTranscript} />
                </div>
              )}
              */}

              <AnswerInput
                onSubmit={actions.submit}
                isLoading={isLoading}
                voiceTranscript={voice.transcript}
                voiceMeta={voice.meta}
              />
            </div>

            {/* History Feed */}
            {history.length > 0 && (
              <div className="pt-8 border-t border-border/50">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">
                  Session History
                </h3>
                <div className="space-y-3 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-[2px] before:bg-border/50">
                  {[...history].reverse().map((entry, i) => (
                    <div key={i} className="relative pl-10 opacity-70 hover:opacity-100 transition-opacity group">
                      <span className="absolute left-[10px] top-4 w-5 h-5 rounded-full border-[3px] border-background bg-muted-foreground/30 group-hover:bg-[var(--accent-violet)] transition-colors z-10" />
                      <Card className="bg-muted/30 border-transparent hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-muted-foreground">
                              Question {entry.questionNumber}
                            </span>
                            <Badge variant="secondary" className={`${entry.evaluation.overallScore >= 7 ? 'text-emerald-500 bg-emerald-500/10' :
                              entry.evaluation.overallScore >= 4 ? 'text-amber-500 bg-amber-500/10' :
                                'text-red-500 bg-red-500/10'
                              }`}>
                              Score: {entry.evaluation.overallScore}/10
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground/80 line-clamp-2">
                            {entry.question.question}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
