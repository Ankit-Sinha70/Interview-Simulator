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
        easy: 'text-emerald-400 border-emerald-400/40',
        medium: 'text-amber-400 border-amber-400/40',
        hard: 'text-red-400 border-red-400/40',
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
                    <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${difficultyVariant[question.difficulty]}`}>
                        {question.difficulty}
                    </span>
                </div>

                {/* Question Text */}
                <p className="text-card-foreground text-[17px] leading-[1.7]">
                    {question.question}
                </p>
            </CardContent>
        </Card>
    );
}
