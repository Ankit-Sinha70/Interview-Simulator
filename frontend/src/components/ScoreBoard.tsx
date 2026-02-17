'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { AggregatedScores, Evaluation } from '@/services/api';

interface ScoreBoardProps {
    history: {
        questionNumber: number;
        evaluation: Evaluation;
        question: { topic: string };
    }[];
    aggregated: AggregatedScores | null;
    onViewReport: () => void;
}

export default function ScoreBoard({ history, aggregated, onViewReport }: ScoreBoardProps) {
    return (
        <Card className="animate-in zoom-in-95 duration-500 bg-zinc-950 border-zinc-800 shadow-2xl overflow-hidden mb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

            <CardHeader className="text-center pb-8 pt-10 relative">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <Trophy className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-black tracking-tight text-white mb-2">
                    Interview Score Board
                </CardTitle>
                <p className="text-zinc-500 text-sm font-medium">Excellent work! Here is the summary of your performance.</p>

                {aggregated && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Overall Avg</p>
                            <p className="text-2xl font-black text-primary">{aggregated.overallAverage.toFixed(1)}</p>
                        </div>
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Technical</p>
                            <p className="text-2xl font-black text-emerald-500">{aggregated.averageTechnical.toFixed(1)}</p>
                        </div>
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Problem Solving</p>
                            <p className="text-2xl font-black text-amber-500">{aggregated.averageProblemSolving.toFixed(1)}</p>
                        </div>
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Communication</p>
                            <p className="text-2xl font-black text-violet-500">{aggregated.averageCommunication.toFixed(1)}</p>
                        </div>
                    </div>
                )}
            </CardHeader>

            <CardContent className="px-8 pb-10 relative">
                <div className="space-y-3">
                    {history.map((entry, i) => {
                        const score = entry.evaluation.overallScore;
                        const isGood = score >= 7;
                        const isMid = score >= 4 && score < 7;

                        return (
                            <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50 hover:bg-zinc-900/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                        Q{entry.questionNumber}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">{entry.question.topic}</p>
                                        <p className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">Evaluation Complete</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-lg font-black text-white">{score}/10</p>
                                        <div className="flex items-center gap-1 justify-end">
                                            {isGood ? (
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            ) : isMid ? (
                                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                            ) : (
                                                <AlertCircle className="w-3 h-3 text-red-500" />
                                            )}
                                            <span className={`text-[9px] font-bold uppercase ${isGood ? 'text-emerald-500' : isMid ? 'text-amber-500' : 'text-red-500'}`}>
                                                {isGood ? 'Strong' : isMid ? 'Average' : 'Needs Work'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-10">
                    <button
                        onClick={onViewReport}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group"
                    >
                        View Full In-Depth Analysis
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-center text-zinc-500 text-[10px] mt-4 font-bold uppercase tracking-widest">
                        Your session data will be available in your dashboard later
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
