'use client';

import React, { useEffect, useState } from 'react';
import { getHint } from '@/services/api';
import { Lightbulb, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface RealTimeFeedbackProps {
    sessionId: string;
    partialAnswer: string;
}

export default function RealTimeFeedback({ sessionId, partialAnswer }: RealTimeFeedbackProps) {
    const [hint, setHint] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        // Clear hint when answer is empty or very short
        if (!partialAnswer || partialAnswer.length < 20) {
            setHint(null);
            setIsTyping(false);
            return;
        }

        setIsTyping(true);

        const timer = setTimeout(async () => {
            setIsTyping(false);
            try {
                const response = await getHint(sessionId, partialAnswer);
                if (response?.hint) {
                    setHint(response.hint);
                }
            } catch (err) {
                // Ignore errors to not disrupt user experience
                console.error('Failed to fetch hint', err);
            }
        }, 3000); // 3-second debounce

        return () => clearTimeout(timer);
    }, [partialAnswer, sessionId]);

    if (!hint && !isTyping) return null;

    // Small heuristic for icon selection
    let Icon = Info;
    let className = 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    
    if (hint?.toLowerCase().includes('good') || hint?.toLowerCase().includes('great')) {
        Icon = CheckCircle;
        className = 'text-green-500 bg-green-500/10 border-green-500/30';
    } else if (hint?.toLowerCase().includes('too long') || hint?.toLowerCase().includes('missing')) {
        Icon = AlertTriangle;
        className = 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    } else if (hint?.toLowerCase().includes('example') || hint?.toLowerCase().includes('💡')) {
        Icon = Lightbulb;
        className = 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    }

    return (
        <div className={`mt-2 px-3 py-2 rounded-lg border text-xs flex items-center gap-2 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 ${isTyping && !hint ? 'opacity-50' : 'opacity-100'} ${className}`}>
            <Icon className="w-4 h-4" />
            <span>
                {isTyping && !hint ? 'Analyzing structure...' : hint}
            </span>
        </div>
    );
}
