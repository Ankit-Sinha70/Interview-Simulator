'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GeneratedQuestion } from '@/services/api';

interface QuestionCardProps {
    question: GeneratedQuestion;
    questionNumber: number;
}

export default function QuestionCard({ question, questionNumber }: QuestionCardProps) {
    const difficultyVariant = {
        easy: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
        medium: 'text-amber-400 border-amber-400/40 bg-amber-400/10',
        hard: 'text-red-400 border-red-400/40 bg-red-400/10',
    };

    const difficultyIcon = {
        easy: '🟢',
        medium: '🟡',
        hard: '🔴',
    };

    return (
        <Card className="animate-slideInRight bg-card border-border shadow-lg mb-6">
            <CardContent className="p-7">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <Badge className="bg-[var(--accent-violet)] text-white text-xs font-bold px-3 py-0.5">
                            Q{questionNumber}
                        </Badge>
                        <span className="text-muted-foreground text-[13px] font-medium">
                            {question.topic}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Level Score Indicator */}
                        {question.levelScore && (
                            <span className="text-xs text-muted-foreground font-medium tabular-nums">
                                Lv.{question.levelScore}
                            </span>
                        )}
                        {/* Difficulty Badge */}
                        <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1.5 ${difficultyVariant[question.difficulty]}`}>
                            <span className="text-[10px]">{difficultyIcon[question.difficulty]}</span>
                            {question.difficulty}
                        </span>
                    </div>
                </div>

                {/* Question Text */}
                <p className="text-card-foreground text-[17px] leading-[1.7]">
                    {question.question}
                </p>
            </CardContent>
        </Card>
    );
}
