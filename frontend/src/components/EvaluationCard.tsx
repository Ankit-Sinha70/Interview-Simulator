'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ScoreBar from './ScoreBar';
import { Evaluation } from '@/services/api';

interface EvaluationCardProps {
    evaluation: Evaluation;
    questionNumber: number;
}

export default function EvaluationCard({ evaluation, questionNumber }: EvaluationCardProps) {
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
            </CardContent>
        </Card>
    );
}
