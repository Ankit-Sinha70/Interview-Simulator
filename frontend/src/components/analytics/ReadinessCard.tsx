'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Brain, Clock, Eye, BarChart3 } from 'lucide-react';

interface ReadinessCardProps {
    readinessScore: number;
    trend: 'Improving' | 'Declining' | 'Stable';
    knowledgeAverage: number;
    timeEfficiency: number;
    focusAverage: number;
    consistencyScore: number;
}

export default function ReadinessCard({
    readinessScore,
    trend,
    knowledgeAverage,
    timeEfficiency,
    focusAverage,
    consistencyScore,
}: ReadinessCardProps) {
    const trendIcon = trend === 'Improving'
        ? <TrendingUp className="w-4 h-4" />
        : trend === 'Declining'
            ? <TrendingDown className="w-4 h-4" />
            : <Minus className="w-4 h-4" />;

    const trendColor = trend === 'Improving'
        ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
        : trend === 'Declining'
            ? 'text-red-400 bg-red-400/10 border-red-400/20'
            : 'text-amber-400 bg-amber-400/10 border-amber-400/20';

    // Calculate gauge arc
    const scoreAngle = (readinessScore / 100) * 180;
    const gaugeColor = readinessScore >= 70 ? '#00cec9' : readinessScore >= 40 ? '#fdcb6e' : '#e17055';

    const subMetrics = [
        { label: 'Knowledge', value: knowledgeAverage, icon: Brain, color: 'from-violet-500 to-purple-600' },
        { label: 'Time Efficiency', value: timeEfficiency, icon: Clock, color: 'from-cyan-500 to-teal-500' },
        { label: 'Focus', value: `${focusAverage}%`, icon: Eye, color: 'from-emerald-500 to-green-500' },
        { label: 'Consistency', value: consistencyScore, icon: BarChart3, color: 'from-amber-500 to-orange-500' },
    ];

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative">
            {/* Gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-violet)]/5 to-[var(--accent-teal)]/5 pointer-events-none" />

            <CardContent className="p-6 md:p-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                    {/* Gauge */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative w-44 h-24 overflow-hidden">
                            <svg viewBox="0 0 200 110" className="w-full h-full">
                                {/* Background arc */}
                                <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.08)"
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                />
                                {/* Score arc */}
                                <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke={gaugeColor}
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(scoreAngle / 180) * 251.3} 251.3`}
                                    className="transition-all duration-1000 ease-out"
                                    style={{ filter: `drop-shadow(0 0 8px ${gaugeColor}40)` }}
                                />
                                {/* Score text */}
                                <text x="100" y="90" textAnchor="middle" className="fill-white text-3xl font-black" fontSize="36">
                                    {readinessScore}
                                </text>
                                <text x="100" y="105" textAnchor="middle" className="fill-slate-400" fontSize="11">
                                    / 100
                                </text>
                            </svg>
                        </div>
                        <div className="text-center">
                            <h2 className="text-lg font-bold text-white">Interview Readiness</h2>
                            <div className={`inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${trendColor}`}>
                                {trendIcon}
                                {trend}
                            </div>
                        </div>
                    </div>

                    {/* Sub metrics */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                        {subMetrics.map((metric) => (
                            <div
                                key={metric.label}
                                className="group p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-300"
                            >
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center mb-2.5 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <metric.icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-2xl font-black text-white">{metric.value}</div>
                                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{metric.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
