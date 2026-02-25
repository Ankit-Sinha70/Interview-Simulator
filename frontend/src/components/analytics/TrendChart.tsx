'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendPoint {
    session: string;
    score: number;
    date: string;
    role: string;
}

interface TrendChartProps {
    data: TrendPoint[];
}

type FilterMode = 'last5' | 'last10' | 'all';

export default function TrendChart({ data }: TrendChartProps) {
    const [filter, setFilter] = useState<FilterMode>('all');

    const filteredData = (() => {
        switch (filter) {
            case 'last5': return data.slice(-5);
            case 'last10': return data.slice(-10);
            default: return data;
        }
    })();

    const filterOptions: { key: FilterMode; label: string }[] = [
        { key: 'last5', label: 'Last 5' },
        { key: 'last10', label: 'Last 10' },
        { key: 'all', label: 'All Time' },
    ];

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">Performance Trend</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Score progression across sessions</p>
                </div>
                <div className="flex gap-1 bg-white/[0.04] rounded-lg p-0.5">
                    {filterOptions.map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setFilter(opt.key)}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 ${filter === opt.key
                                ? 'bg-[var(--accent-violet)] text-white shadow-lg shadow-[var(--accent-violet)]/20'
                                : 'text-muted-foreground hover:text-white'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
            <CardContent className="p-4">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.5} />
                            <XAxis
                                dataKey="session"
                                stroke="#bbb"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                domain={[0, 10]}
                                stroke="#bbb"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dx={-5}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.9)',
                                    borderRadius: '12px',
                                    border: '1px solid #444',
                                    backdropFilter: 'blur(8px)',
                                    color: 'white',
                                    fontSize: '12px',
                                }}
                                formatter={(value: any) => [Number(value).toFixed(1), 'Score']}
                                labelFormatter={(label: any, payload: any) => {
                                    if (payload?.[0]?.payload) {
                                        const p = payload[0].payload;
                                        return `${label} • ${p.role} • ${new Date(p.date).toLocaleDateString()}`;
                                    }
                                    return String(label);
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="#6c5ce7"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#trendGradient)"
                                dot={{ r: 5, fill: '#6c5ce7', strokeWidth: 2, stroke: '#1a1a2e' }}
                                activeDot={{ r: 7, strokeWidth: 0, fill: 'white' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
