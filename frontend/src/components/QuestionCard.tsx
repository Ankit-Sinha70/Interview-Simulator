'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GeneratedQuestion } from '@/services/api';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface QuestionCardProps {
    question: GeneratedQuestion;
    questionNumber: number;
    trend?: 'up' | 'down' | 'flat';
}

export default function QuestionCard({ question, questionNumber, trend }: QuestionCardProps) {
    const [showWhy, setShowWhy] = useState(false);

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
                        {question.source === 'resume' && (
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] px-2 py-0">
                                📄 Based on resume{question.relatedContext ? `: ${question.relatedContext}` : ''}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Trend Indicator */}
                        {trend && (
                            <span 
                                className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                                    trend === 'up' ? 'text-[var(--accent-teal)]' : 
                                    trend === 'down' ? 'text-red-400' : 'text-muted-foreground'
                                }`}
                                title={trend === 'up' ? 'Difficulty Increased' : trend === 'down' ? 'Difficulty Decreased' : 'Difficulty Maintained'}
                            >
                                {trend === 'up' ? '📈 Trending Up' : trend === 'down' ? '📉 Trending Down' : '➡️ Stable'}
                            </span>
                        )}
                        {/* Level Score Indicator */}
                        {question.levelScore && (
                            <span className="text-xs text-muted-foreground font-medium tabular-nums ml-2">
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

                {/* Why Asked Insight */}
                {question.whyAsked && (
                    <div className="mt-5 pt-4 border-t border-border/50">
                        <button
                            onClick={() => setShowWhy(!showWhy)}
                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showWhy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Why this was asked
                        </button>
                        {showWhy && (
                            <p className="mt-3 text-[14px] text-muted-foreground/80 italic leading-relaxed animate-in fade-in slide-in-from-top-2">
                                {question.whyAsked}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
