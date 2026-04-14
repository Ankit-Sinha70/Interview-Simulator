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

    let severity = 'Low';
    let severityColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (recurrencePct > 50) {
        severity = 'High';
        severityColor = 'text-red-400 bg-red-500/10 border-red-500/20';
    } else if (recurrencePct > 25) {
        severity = 'Medium';
        severityColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }

    if (totalSessions === 0 || weaknessInsights.recurringWeakCount === 0) {
        return (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border/50">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">Weakness Tracker</h3>
                </div>
                <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center">
                    <Target className="w-10 h-10 mb-3 opacity-20" />
                    <p>Complete more interviews to identify your weak areas.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
                <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        Weakness Tracker
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Focus areas holding back your score</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${severityColor}`}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Severity: {severity}
                </div>
            </div>
            
            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
                    
                    {/* 1. Top Weak Area */}
                    <div className="p-6 flex flex-col justify-center">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span>Top Weak Area</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                <span className="text-xl">❌</span>
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-foreground">{weaknessInsights.recurringWeakDimension}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Flagged in <strong className="text-foreground">{recurrencePct}%</strong> of sessions
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Impact Analysis */}
                    <div className="p-6 flex flex-col justify-center bg-muted/20">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Target className="w-3.5 h-3.5" />
                            <span>Impact Score</span>
                        </div>
                        <div className="flex items-end gap-3">
                            <div className="text-4xl font-black text-amber-400 tracking-tighter">
                                {weaknessInsights.lowScoreQuestionCount}
                            </div>
                            <div className="pb-1 text-sm text-muted-foreground leading-snug">
                                questions received <br />a low score ({'<'} 5/10).
                            </div>
                        </div>
                    </div>

                    {/* 3. Action Plan */}
                    <div className="p-6 flex flex-col justify-center bg-[var(--accent-violet)]/5">
                        <div className="text-xs font-bold text-[var(--accent-violet)] uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Recommended Practice</span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                            {weaknessInsights.suggestedFocus}
                        </p>
                    </div>

                </div>
            </CardContent>
            
            {/* Improvement Tracking Bar */}
            <div className="px-6 py-4 bg-muted/30 border-t border-border/50">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Improvement Tracking ({weaknessInsights.recurringWeakDimension})</span>
                    <span className="text-red-400 font-bold">{recurrencePct}% recurrence</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full" 
                        style={{ width: `${recurrencePct}%` }} 
                    />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-right">Target recurrence: {'<'} 15%</p>
            </div>
        </Card>
    );
}
