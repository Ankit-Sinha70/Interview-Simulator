'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Target, Lightbulb, TrendingDown } from 'lucide-react';

interface WeaknessInsightsProps {
    weaknessInsights: {
        recurringWeakDimension: string;
        recurringWeakCount: number;
        lowScoreQuestionCount: number;
        suggestedFocus: string;
    };
    totalSessions: number;
}

export default function WeaknessInsights({ weaknessInsights, totalSessions }: WeaknessInsightsProps) {
    const recurrencePct = totalSessions > 0
        ? Math.round((weaknessInsights.recurringWeakCount / totalSessions) * 100)
        : 0;

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">Weakness Intelligence</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Patterns and improvement targets</p>
            </div>
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Recurring weakness */}
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <TrendingDown className="w-4 h-4 text-red-400" />
                            </div>
                            <div>
                                <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Recurring Weakness</div>
                                <div className="text-base font-bold text-white">{weaknessInsights.recurringWeakDimension}</div>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Flagged as weakest in <span className="text-white font-bold">{recurrencePct}%</span> of your sessions ({weaknessInsights.recurringWeakCount}/{totalSessions})
                        </div>
                    </div>

                    {/* Low score sessions */}
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Low Score Sessions</div>
                                <div className="text-base font-bold text-white">{weaknessInsights.lowScoreQuestionCount}</div>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Sessions with average score below <span className="text-white font-bold">5.0</span>
                        </div>
                    </div>

                    {/* Suggested focus — full width */}
                    <div className="md:col-span-2 p-4 rounded-xl bg-[var(--accent-violet)]/5 border border-[var(--accent-violet)]/15 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[var(--accent-violet)]/20 flex items-center justify-center">
                                <Lightbulb className="w-4 h-4 text-[var(--accent-violet)]" />
                            </div>
                            <div>
                                <div className="text-[10px] text-[var(--accent-violet)] font-bold uppercase tracking-wider">Suggested Focus Area</div>
                            </div>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {weaknessInsights.suggestedFocus}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
