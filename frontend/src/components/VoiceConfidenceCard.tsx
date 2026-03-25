'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Activity, Clock, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';

interface VoiceEvaluation {
    confidenceScore: number;
    fluencyScore: number;
    structureScore: number;
    professionalismScore: number;
    spokenDeliveryOverall: number;
    toneVariation: string;
    detectedIssues: string[];
    feedback: string[];
}

interface VoiceMetadata {
    durationSeconds: number;
    fillerWordCount: number;
    pauseCount: number;
    wordsPerMinute: number;
}

interface VoiceConfidenceCardProps {
    voiceEvaluation: VoiceEvaluation;
    voiceMeta: VoiceMetadata;
}

export default function VoiceConfidenceCard({ voiceEvaluation, voiceMeta }: VoiceConfidenceCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
        if (score >= 60) return 'bg-amber-500/10 border-amber-500/20';
        return 'bg-red-500/10 border-red-500/20';
    };

    return (
        <Card className="bg-zinc-950 border-zinc-800 shadow-xl overflow-hidden mt-4">
            <div className="px-5 py-3 border-b border-zinc-800/50 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-300">
                    <Mic className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Voice Analysis</span>
                </div>
                <Badge variant="outline" className={`text-xs ${getScoreBg(voiceEvaluation.confidenceScore)} ${getScoreColor(voiceEvaluation.confidenceScore)}`}>
                    Confidence: {voiceEvaluation.confidenceScore}/100
                </Badge>
            </div>
            
            <CardContent className="p-5 space-y-5">
                {/* Top Metrics Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50 flex flex-col items-center text-center">
                        <Activity className="w-4 h-4 text-[var(--accent-teal)] mb-1 opacity-70" />
                        <span className="text-lg font-bold text-white mb-0.5">{voiceMeta.wordsPerMinute}</span>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">WPM</span>
                    </div>
                    
                    <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50 flex flex-col items-center text-center">
                        <MessageSquare className="w-4 h-4 text-pink-400 mb-1 opacity-70" />
                        <span className="text-lg font-bold text-white mb-0.5">{voiceMeta.fillerWordCount}</span>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Filler Words</span>
                    </div>
                    
                    <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50 flex flex-col items-center text-center">
                        <Clock className="w-4 h-4 text-amber-400 mb-1 opacity-70" />
                        <span className="text-lg font-bold text-white mb-0.5">{voiceMeta.pauseCount}</span>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Long Pauses</span>
                    </div>
                    
                    <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50 flex flex-col items-center text-center">
                        <Mic className="w-4 h-4 text-violet-400 mb-1 opacity-70" />
                        <span className="text-sm font-bold text-white truncate max-w-full leading-relaxed mb-0.5" title={voiceEvaluation.toneVariation}>{voiceEvaluation.toneVariation}</span>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Tone</span>
                    </div>
                </div>

                {/* Detected Issues */}
                {voiceEvaluation.detectedIssues && voiceEvaluation.detectedIssues.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Detected Issues
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {voiceEvaluation.detectedIssues.map((issue, i) => (
                                <Badge key={i} variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-xs py-1">
                                    {issue}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Feedback */}
                {voiceEvaluation.feedback && voiceEvaluation.feedback.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Targeted Feedback
                        </div>
                        <ul className="space-y-1.5 text-sm text-zinc-300">
                            {voiceEvaluation.feedback.map((item, i) => (
                                <li key={i} className="flex gap-2.5">
                                    <span className="text-[var(--accent-teal)] mt-0.5 shrink-0">→</span>
                                    <span className="leading-relaxed">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
