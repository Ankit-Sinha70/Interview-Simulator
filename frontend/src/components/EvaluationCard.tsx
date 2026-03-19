'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ScoreBar from './ScoreBar';
import LockedSection from './LockedSection';
import { Evaluation } from '@/services/api';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface EvaluationCardProps {
    evaluation: Evaluation;
    questionNumber: number;
    isPro?: boolean;
}

export default function EvaluationCard({ evaluation, questionNumber, isPro = false }: EvaluationCardProps) {
    const [showIdeal, setShowIdeal] = useState(false);

    const overallColor = evaluation.overallScore >= 7
        ? 'text-emerald-400 bg-emerald-500/15'
        : evaluation.overallScore >= 4
            ? 'text-amber-400 bg-amber-500/15'
            : 'text-red-400 bg-red-500/15';

    return (
        <Card className="animate-fadeInUp bg-card border-border shadow-lg mb-6">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">
                        📊 Evaluation — Question {questionNumber}
                    </CardTitle>
                    <Badge className={`${overallColor} text-sm font-bold px-4 py-1 border-0`}>
                        {evaluation.overallScore}/10
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Score Bars */}
                <div className="flex flex-col gap-2.5">
                    <ScoreBar label="Technical" score={evaluation.technicalScore} delay={0} />
                    <ScoreBar label="Depth" score={evaluation.depthScore} delay={60} />
                    <ScoreBar label="Clarity" score={evaluation.clarityScore} delay={120} />
                    <ScoreBar label="Problem Solving" score={evaluation.problemSolvingScore} delay={180} />
                    <ScoreBar label="Communication" score={evaluation.communicationScore} delay={240} />
                </div>

                <Separator className="bg-border" />

                {/* Ideal Answer */}
                {evaluation.idealAnswer && (
                    <div className="bg-blue-500/[0.06] rounded-lg p-4 border border-blue-500/[0.12]">
                        <button
                            onClick={() => setShowIdeal(!showIdeal)}
                            className="flex w-full items-center justify-between text-blue-400 text-xs font-bold uppercase tracking-wider"
                        >
                            <span className="flex items-center gap-2">💡 Ideal Answer Example</span>
                            {showIdeal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showIdeal && (
                            <div className="mt-4 pt-4 border-t border-blue-500/[0.12]">
                                <p className="text-[14px] text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-2 whitespace-pre-wrap">
                                    {evaluation.idealAnswer}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-500/[0.06] rounded-lg p-4 border border-emerald-500/[0.12]">
                        <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                            ✅ Strengths
                        </h4>
                        <ul className="space-y-1">
                            {evaluation.strengths.map((s, i) => (
                                <li key={i} className="text-muted-foreground text-[13px] leading-relaxed pl-3 relative">
                                    <span className="absolute left-0 text-emerald-400">•</span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-red-500/[0.06] rounded-lg p-4 border border-red-500/[0.12]">
                        <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
                            ⚠️ Weaknesses
                        </h4>
                        <ul className="space-y-1">
                            {evaluation.weaknesses.map((w, i) => (
                                <li key={i} className="text-muted-foreground text-[13px] leading-relaxed pl-3 relative">
                                    <span className="absolute left-0 text-red-400">•</span>
                                    {w}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Improvements */}
                {isPro ? (
                    <div className="bg-violet-500/[0.06] rounded-lg p-4 border border-violet-500/[0.12]">
                        <h4 className="text-[var(--accent-violet)] text-xs font-bold uppercase tracking-wider mb-3">
                            💡 Improvements
                        </h4>
                        <ul className="space-y-1">
                            {evaluation.improvements.map((imp, i) => (
                                <li key={i} className="text-muted-foreground text-[13px] leading-relaxed pl-4 relative">
                                    <span className="absolute left-0 text-[var(--accent-violet)] text-xs">{i + 1}.</span>
                                    {imp}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <LockedSection featureLabel="See How To Improve">
                        <div className="bg-violet-500/[0.06] rounded-lg p-4 border border-violet-500/[0.12]">
                            <h4 className="text-[var(--accent-violet)] text-xs font-bold uppercase tracking-wider mb-3">
                                💡 Improvements
                            </h4>
                            <div className="space-y-3">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-4 h-4 rounded-full bg-violet-500/20 shrink-0 mt-0.5" />
                                        <div className="flex-1 space-y-2 pt-1">
                                            <div className="h-2 w-full bg-slate-800/50 rounded" />
                                            <div className="h-2 w-4/5 bg-slate-800/50 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </LockedSection>
                )}
            </CardContent>
        </Card>
    );
}
