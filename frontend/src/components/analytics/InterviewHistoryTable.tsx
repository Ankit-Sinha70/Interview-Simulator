'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface InterviewRecord {
    date: string;
    role: string;
    score: number;
    questionsCount: number;
    timeMinutes: number;
    focusScore: number;
    status: string;
    sessionId: string;
}

interface InterviewHistoryTableProps {
    interviews: InterviewRecord[];
}

function getScoreColor(score: number): string {
    if (score >= 7.5) return 'text-emerald-400';
    if (score >= 5) return 'text-amber-400';
    return 'text-red-400';
}

function getStatusBadge(status: string) {
    const variants: Record<string, { classes: string }> = {
        'Strong Hire': { classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
        'Hire': { classes: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
        'Borderline': { classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
        'No Hire': { classes: 'bg-red-500/15 text-red-400 border-red-500/30' },
    };

    const config = variants[status] || { classes: 'bg-muted/30 text-muted-foreground border-border/50' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.classes}`}>
            {status}
        </span>
    );
}

export default function InterviewHistoryTable({ interviews }: InterviewHistoryTableProps) {
    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">Interview History</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{interviews.length} completed sessions</p>
            </div>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                                <th className="px-6 py-3 text-left font-bold">Date</th>
                                <th className="px-4 py-3 text-left font-bold">Role</th>
                                <th className="px-4 py-3 text-center font-bold">Score</th>
                                <th className="px-4 py-3 text-center font-bold">Questions</th>
                                <th className="px-4 py-3 text-center font-bold">Time</th>
                                <th className="px-4 py-3 text-center font-bold">Focus</th>
                                <th className="px-4 py-3 text-center font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {interviews.map((interview, i) => (
                                <tr
                                    key={interview.sessionId || i}
                                    className="border-b border-border/30 hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="px-6 py-3 text-xs text-muted-foreground">
                                        {new Date(interview.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs font-medium text-white truncate max-w-[140px] block">{interview.role}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-sm font-bold ${getScoreColor(interview.score)}`}>
                                            {interview.score}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                                        {interview.questionsCount}
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                                        {interview.timeMinutes > 0 ? `${interview.timeMinutes}m` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                                        {interview.focusScore > 0 ? `${interview.focusScore}%` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {getStatusBadge(interview.status)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {interviews.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        No interview history yet. Complete your first interview to see results here.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
