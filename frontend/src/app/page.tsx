'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import SessionSetup from '@/components/SessionSetup';
import QuestionCard from '@/components/QuestionCard';
import AnswerInput from '@/components/AnswerInput';
import VoiceInput from '@/components/VoiceInput';
import EvaluationCard from '@/components/EvaluationCard';
import ReportView from '@/components/ReportView';
import {
  startInterview,
  submitAnswer,
  completeInterview,
  GeneratedQuestion,
  Evaluation,
  FinalReport,
  AnswerResponse,
  VoiceMetadata,
} from '@/services/api';

type AppState = 'setup' | 'interview' | 'report';

interface InterviewHistoryEntry {
  question: GeneratedQuestion;
  evaluation: Evaluation;
  questionNumber: number;
}

export default function Home() {
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
      setError(err.message || 'Failed to start interview');
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
      setCurrentQuestion(result.nextQuestion);
      setQuestionNumber(result.questionNumber + 1);
      setVoiceTranscript(undefined);
      setVoiceMeta(undefined);
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

  // ─── Error Banner ───
  const ErrorBanner = error ? (
    <div className="max-w-[750px] mx-auto mb-4 px-5 py-3.5 bg-red-500/10 border border-red-500/25 rounded-lg text-[var(--accent-coral)] text-sm flex items-center justify-between">
      <span>⚠️ {error}</span>
      <button onClick={() => setError(null)} className="bg-transparent border-none text-[var(--accent-coral)] cursor-pointer text-lg">×</button>
    </div>
  ) : null;

  // ═══ SETUP ═══
  if (appState === 'setup') {
    return (
      <main>
        {ErrorBanner}
        <SessionSetup onStart={handleStart} isLoading={isLoading} />
      </main>
    );
  }

  // ═══ REPORT ═══
  if (appState === 'report' && report) {
    return (
      <main>
        {ErrorBanner}
        <ReportView report={report} onNewSession={handleNewSession} />
      </main>
    );
  }

  // ═══ INTERVIEW ═══
  return (
    <main className="max-w-[800px] mx-auto px-6 py-8">
      {ErrorBanner}

      {/* Top Bar */}
      <div className="animate-fadeIn flex items-center justify-between mb-8 pb-5 border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gradient-hero">🎯 Interview in Progress</h1>
          <Badge variant="secondary" className="text-xs font-semibold">
            Question {questionNumber}
          </Badge>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseVoice(!useVoice)}
            className={`rounded-full text-xs font-semibold transition-all duration-250 ${useVoice
                ? 'border-[var(--accent-teal)] text-[var(--accent-teal)] bg-teal-500/10'
                : 'border-border text-muted-foreground'
              }`}
          >
            🎤 {useVoice ? 'Voice ON' : 'Voice OFF'}
          </Button>

          {history.length >= 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleComplete}
              disabled={isLoading}
              className="rounded-full text-xs font-semibold border-[var(--accent-violet)] text-[var(--accent-violet)] bg-violet-500/10 hover:bg-violet-500/20"
            >
              {isLoading ? '⏳ Generating...' : '✅ Complete Interview'}
            </Button>
          )}
        </div>
      </div>

      {/* Latest Evaluation */}
      {latestEvaluation && (
        <EvaluationCard evaluation={latestEvaluation} questionNumber={questionNumber - 1} />
      )}

      {/* Current Question */}
      {currentQuestion && (
        <QuestionCard question={currentQuestion} questionNumber={questionNumber} />
      )}

      {/* Voice Input */}
      {useVoice && <VoiceInput onTranscript={handleVoiceTranscript} />}

      {/* Answer Input */}
      <AnswerInput
        onSubmit={handleSubmitAnswer}
        isLoading={isLoading}
        voiceTranscript={voiceTranscript}
        voiceMeta={voiceMeta}
      />

      {/* Question History */}
      {history.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[1.5px] mb-4">
            Previous Questions
          </h3>
          {[...history].reverse().map((entry, i) => (
            <Card key={i} className="bg-card border-border mb-2 opacity-70 hover:opacity-100 transition-opacity">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-muted-foreground text-[13px] font-semibold">
                    Q{entry.questionNumber} — {entry.question.topic}
                  </span>
                  <span className={`text-[13px] font-bold ${entry.evaluation.overallScore >= 7 ? 'text-emerald-400'
                      : entry.evaluation.overallScore >= 4 ? 'text-amber-400'
                        : 'text-red-400'
                    }`}>
                    {entry.evaluation.overallScore}/10
                  </span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {entry.question.question.substring(0, 120)}...
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
