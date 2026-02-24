
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import SessionSetup from '@/components/SessionSetup';
import QuestionCard from '@/components/QuestionCard';
import AnswerInput from '@/components/AnswerInput';
import VoiceInput from '@/components/VoiceInput';
import EvaluationCard from '@/components/EvaluationCard';
import ReportView from '@/components/ReportView';
import UpgradeModal from '@/components/UpgradeModal';
import { useAuth } from '@/context/AuthContext';
import {
  startInterview,
  submitAnswer,
  completeInterview,
  GeneratedQuestion,
  Evaluation,
  FinalReport,
  AnswerResponse,
  VoiceMetadata,
  verifySubscription,
  AttentionStats,
} from '@/services/api';
import { EyeTracker } from '@/components/eye-tracker/EyeTracker';

type AppState = 'setup' | 'interview' | 'report';

interface InterviewHistoryEntry {
  question: GeneratedQuestion;
  evaluation: Evaluation;
  questionNumber: number;
}

export default function Home() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    }>
      <HomeContent />
    </React.Suspense>
  );
}

function HomeContent() {
  const attentionStatsRef = React.useRef<AttentionStats | null>(null);
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [appState, setAppState] = useState<AppState>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);

  const [history, setHistory] = useState<InterviewHistoryEntry[]>([]);
  const [latestEvaluation, setLatestEvaluation] = useState<Evaluation | null>(null);
  const [report, setReport] = useState<FinalReport | null>(null);

  // Voice state
  const [voiceTranscript, setVoiceTranscript] = useState<string | undefined>();
  const [voiceMeta, setVoiceMeta] = useState<VoiceMetadata | undefined>();
  const [useVoice, setUseVoice] = useState(false);

  // Refresh user data if returning from Stripe payment
  // Refresh user data if returning from Stripe payment
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId && user?.planType === 'FREE') {
      verifySubscription(sessionId)
        .then(() => refreshUser())
        .then(() => {
          router.replace('/analytics?upgraded=true');
        })
        .catch(err => console.error("Verification failed", err));
    }
  }, [searchParams, user, refreshUser, router]);

  // Auth Protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Sidebar Visibility Management
  useEffect(() => {
    if (appState === 'interview') {
      document.body.classList.add('hide-sidebar');
    } else {
      document.body.classList.remove('hide-sidebar');
    }
    return () => document.body.classList.remove('hide-sidebar');
  }, [appState]);

  // ─── Start Interview ───
  const handleStart = useCallback(async (role: string, experienceLevel: 'Junior' | 'Mid' | 'Senior') => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await startInterview({ role, experienceLevel, mode: 'text' });
      setSessionId(result.sessionId);
      setCurrentQuestion(result.question);
      setQuestionNumber(1);
      setAppState('interview');
    } catch (err: any) {
      if (err.message && err.message.includes('Limit reached')) {
        setError('Free plan limit reached. Please upgrade to Pro.');
      } else {
        setError(err.message || 'Failed to start interview');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Submit Answer ───
  const handleSubmitAnswer = useCallback(async (answer: string, meta?: VoiceMetadata) => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result: AnswerResponse = await submitAnswer(sessionId, answer, meta);

      // Save this Q&A to history
      if (currentQuestion) {
        setHistory((prev) => [
          ...prev,
          {
            question: currentQuestion,
            evaluation: result.evaluation,
            questionNumber: result.questionNumber,
          },
        ]);
      }
      setLatestEvaluation(result.evaluation);
      setVoiceTranscript(undefined);
      setVoiceMeta(undefined);

      if (result.sessionEnded) {
        console.log('[Interview] Session ended by backend:', result.reason);
        if (result.finalReport) {
          setReport(result.finalReport);
        } else {
          const finalReport = await completeInterview(sessionId, attentionStatsRef.current || undefined);
          setReport(finalReport);
        }
        setCurrentQuestion(null);
        setAppState('report');
        return;
      }

      setCurrentQuestion(result.nextQuestion);
      setQuestionNumber(result.questionNumber + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, currentQuestion]);

  // ─── Complete Interview ───
  const handleComplete = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const finalReport = await completeInterview(sessionId);
      setReport(finalReport);
      setAppState('report');
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // ─── New Session ───
  const handleNewSession = useCallback(() => {
    setAppState('setup');
    setSessionId(null);
    setCurrentQuestion(null);
    setQuestionNumber(1);
    setHistory([]);
    setLatestEvaluation(null);
    setReport(null);
    setError(null);
    setVoiceTranscript(undefined);
    setVoiceMeta(undefined);
  }, []);

  // ─── Voice Transcript Handler ───
  const handleVoiceTranscript = useCallback((transcript: string, meta: VoiceMetadata) => {
    setVoiceTranscript(transcript);
    setVoiceMeta(meta);
  }, []);

  // Loading state for auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // ─── Layout Components ───
  const ErrorBanner = error ? (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-in-down w-[90%] max-w-lg">
      <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground px-4 py-3 rounded-xl shadow-lg flex items-center justify-between backdrop-blur-md">
        <span className="flex items-center gap-2 text-sm font-medium">⚠️ {error}</span>
        <button onClick={() => setError(null)} className="hover:bg-destructive/20 rounded-full p-1 transition-colors">
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

      {appState === 'setup' && (
        <main className="flex-1 flex flex-col items-center justify-center">
          <SessionSetup onStart={handleStart} isLoading={isLoading} />
        </main>
      )}

      {appState === 'report' && report && (
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 pb-12">
          <ReportView report={report} onNewSession={handleNewSession} scores={{
            averageTechnical: 0,
            averageDepth: 0,
            averageClarity: 0,
            averageProblemSolving: 0,
            averageCommunication: 0,
            overallAverage: report.averageScore,
            strongestDimension: report.strongestAreas[0] || 'N/A',
            weakestDimension: report.weakestAreas[0] || 'N/A'
          }} />
        </main>
      )}

      {appState === 'interview' && (
        <main className="flex-1 w-full max-w-8xl mx-auto px-4 sm:px-6 py-6 pb-24">



          {/* Top Navbar */}
          <header className="sticky top-4 z-40 bg-background/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-sm px-4 py-3 mb-8 flex items-center justify-between animate-slide-in-down">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" title="Live" />
              <h1 className="text-sm font-bold tracking-tight text-muted-foreground uppercase">Interview Session</h1>
              <Badge variant="outline" className="text-xs border-[var(--accent-violet)] text-[var(--accent-violet)] bg-[var(--accent-violet)]/5">
                Q{questionNumber}
              </Badge>
              {user?.planType === 'FREE' && (
                <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-500 ml-2">
                  Free User ({user.interviewsUsedThisMonth}/2 Used)
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {user?.planType === 'FREE' && (
                <UpgradeModal
                  trigger={
                    <Button size="sm" variant="outline" className="h-8 text-xs border-[var(--accent-violet)] text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/10">
                      Upgrade
                    </Button>
                  }
                />
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseVoice(!useVoice)}
                className={`rounded-full text-xs font-semibold h-8 transition-colors ${useVoice
                  ? 'text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 hover:bg-[var(--accent-teal)]/20'
                  : 'text-muted-foreground hover:bg-muted'
                  }`}
              >
                {useVoice ? '🎤 Voice Active' : '🔇 Voice Off'}
              </Button>

              {history.length >= 1 && (
                <Button
                  size="sm"
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="rounded-full text-xs font-bold h-8 bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent transition-all"
                >
                  {isLoading ? '...' : 'Finish'}
                </Button>
              )}
            </div>
          </header>

          <EyeTracker statsRef={attentionStatsRef} />

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
              {useVoice && (
                <div className="animate-zoom-in">
                  <VoiceInput onTranscript={handleVoiceTranscript} />
                </div>
              )}

              <AnswerInput
                onSubmit={handleSubmitAnswer}
                isLoading={isLoading}
                voiceTranscript={voiceTranscript}
                voiceMeta={voiceMeta}
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
