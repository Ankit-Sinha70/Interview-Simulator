'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ScoreBarProps {
    label: string;
    score: number;
    maxScore?: number;
    delay?: number;
}

export default function ScoreBar({ label, score, maxScore = 10, delay = 0 }: ScoreBarProps) {
    const percentage = (score / maxScore) * 100;

    const getColor = () => {
        if (score >= 7) return 'text-emerald-400';
        if (score >= 4) return 'text-amber-400';
        return 'text-red-400';
    };

    const getBarColor = () => {
        if (score >= 7) return '[&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-400';
        if (score >= 4) return '[&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-400';
        return '[&>div]:bg-gradient-to-r [&>div]:from-red-400 [&>div]:to-rose-500';
    };

    return (
        <div
            className="flex items-center gap-3 animate-fadeIn"
            style={{ animationDelay: `${delay}ms` }}
        >
            <span className="text-muted-foreground text-[13px] font-medium min-w-[130px] text-right">
                {label}
            </span>
            <Progress
                value={percentage}
                className={`flex-1 h-2 bg-white/[0.06] ${getBarColor()}`}
            />
            <span className={`${getColor()} text-sm font-bold min-w-[36px] text-center`}>
                {score}
            </span>
        </div>
    );
}
