'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Shield, Trophy, AlertTriangle, ArrowRight, Lightbulb } from 'lucide-react';

interface SessionIntegrityProps {
    sessionIntegrity: {
        completedSessions: number;
        abandonedSessions: number;
        abandonRate: number;
        healthStatus: 'Healthy' | 'Moderate' | 'Needs Attention';
        avgScoreBeforeAbandon: number;
        avgFocusBeforeAbandon: number;
        avgQuestionsBeforeAbandon: number;
        mostAbandonedAtQuestion: number | null;
        insights: string[];
        completionStreak: number;
    };
}

const HEALTH_CONFIG = {
    Healthy: {
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        glow: 'shadow-emerald-500/5',
        icon: '🟢',
        label: 'Healthy',
    },
    Moderate: {
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        glow: 'shadow-amber-500/5',
        icon: '🟡',
        label: 'Moderate',
    },
    'Needs Attention': {
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        glow: 'shadow-red-500/5',
        icon: '🔴',
        label: 'Needs Attention',
    },
};

export default function SessionIntegrity({ sessionIntegrity }: SessionIntegrityProps) {
    const {
        completedSessions,
        abandonedSessions,
        abandonRate,
        healthStatus,
        avgScoreBeforeAbandon,
        avgFocusBeforeAbandon,
        avgQuestionsBeforeAbandon,
        insights,
        completionStreak,
    } = sessionIntegrity;

    const health = HEALTH_CONFIG[healthStatus];
    const totalSessions = completedSessions + abandonedSessions;

    const donutData = [
        { name: 'Completed', value: completedSessions, color: '#10b981' },
        { name: 'Abandoned', value: abandonedSessions, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Edge case: no sessions at all
    if (totalSessions === 0) {
        donutData.push({ name: 'No Data', value: 1, color: '#27272a' });
    }

    return (
        <div className="rounded-2xl bg-card/50 border border-border/50 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground tracking-tight">Session Integrity</h3>
                        <p className="text-xs text-muted-foreground">Completion behavior & patterns</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${health.bg} ${health.color} ${health.border} border`}>
                    <span>{health.icon}</span>
                    <span>{health.label}</span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Donut Chart */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={donutData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {donutData.map((entry, idx) => (
                                        <Cell key={idx} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-foreground">{100 - abandonRate}%</span>
                            <span className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">Complete</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-6 mt-3">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-xs text-muted-foreground">Completed ({completedSessions})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-xs text-muted-foreground">Abandoned ({abandonedSessions})</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        label="Completed"
                        value={completedSessions.toString()}
                        color="text-emerald-400"
                        bg="bg-emerald-500/5"
                    />
                    <StatCard
                        label="Abandoned"
                        value={abandonedSessions.toString()}
                        color="text-red-400"
                        bg="bg-red-500/5"
                    />
                    <StatCard
                        label="Abandon Rate"
                        value={`${abandonRate}%`}
                        color={abandonRate > 30 ? 'text-red-400' : abandonRate > 15 ? 'text-amber-400' : 'text-emerald-400'}
                        bg={abandonRate > 30 ? 'bg-red-500/5' : abandonRate > 15 ? 'bg-amber-500/5' : 'bg-emerald-500/5'}
                    />
                    <StatCard
                        label="Avg. Qs Before Quit"
                        value={avgQuestionsBeforeAbandon > 0 ? `Q${avgQuestionsBeforeAbandon}` : '—'}
                        color="text-purple-400"
                        bg="bg-purple-500/5"
                    />
                </div>
            </div>

            {/* Correlation Metrics */}
            {abandonedSessions > 0 && (
                <div className="flex flex-wrap gap-3">
                    {avgScoreBeforeAbandon > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/70 border border-border/60 text-xs">
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Avg score before abandon:</span>
                            <span className="text-foreground font-bold">{avgScoreBeforeAbandon}/10</span>
                        </div>
                    )}
                    {avgFocusBeforeAbandon > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/70 border border-border/60 text-xs">
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Avg focus before abandon:</span>
                            <span className="text-foreground font-bold">{avgFocusBeforeAbandon}%</span>
                        </div>
                    )}
                </div>
            )}

            {/* Completion Streak Badge */}
            {completionStreak >= 3 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <div>
                        <p className="text-sm font-bold text-foreground">
                            🏅 {completionStreak} Interviews Completed Without Abandoning
                        </p>
                        <p className="text-[11px] text-amber-400/70">Keep up the discipline for better analytics!</p>
                    </div>
                </div>
            )}

            {/* Behavioral Insights */}
            {insights.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <Lightbulb className="w-3.5 h-3.5" />
                        Behavioral Insights
                    </div>
                    <div className="space-y-1.5">
                        {insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-background/60 border border-border/50">
                                <span className="text-violet-400 mt-0.5 text-xs">●</span>
                                <p className="text-sm text-foreground/80 leading-relaxed">{insight}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<Record<string, unknown>>; label?: string | number; }) {
    if (!active || !payload || payload.length === 0) return null;
    const raw = ((payload[0] as Record<string, unknown>)['payload'] as Record<string, unknown> | undefined) ?? (payload[0] as Record<string, unknown>);
    const item = raw as Record<string, unknown>;
    const name = (item.name as string) ?? ((payload[0] as Record<string, unknown>).name as string) ?? String(label ?? '');
    const value = (item.value as number) ?? ((payload[0] as Record<string, unknown>).value as number) ?? 0;

    return (
        <div className="bg-card/90 border border-border rounded-lg text-sm text-foreground p-3 shadow-xl">
            <div className="text-xs text-muted-foreground font-semibold">{name}</div>
            <div className="mt-1 font-bold">{value} sessions</div>
        </div>
    );
}

function StatCard({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
    return (
        <div className={`${bg} rounded-xl p-3.5 border border-border/50 space-y-1`}>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
            <p className={`text-xl font-black ${color}`}>{value}</p>
        </div>
    );
}
