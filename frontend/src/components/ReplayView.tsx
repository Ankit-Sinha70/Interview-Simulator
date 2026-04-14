'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, X, RotateCcw } from 'lucide-react';
import QuestionCard from './QuestionCard';
import EvaluationCard from './EvaluationCard';
import VoiceConfidenceCard from './VoiceConfidenceCard';
import { Badge } from '@/components/ui/badge';

interface ReplayViewProps {
    session: any;
    onClose: () => void;
    isPro: boolean;
}

export default function ReplayView({ session, onClose, isPro }: ReplayViewProps) {
    const questions = session?.questions || [];
    const totalSteps = questions.length * 3;
    const [step, setStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Auto-advance logic
    useEffect(() => {
        if (!isPlaying) return;
        
        let delay = 3000; // Base delay
        const phase = step % 3;
        if (phase === 0) delay = 4000; // Time to read question
        if (phase === 1) delay = 5000; // Time to read answer
        if (phase === 2) delay = 6000; // Time to review feedback

        const timer = setTimeout(() => {
            if (step < totalSteps - 1) {
                setStep(s => s + 1);
            } else {
                setIsPlaying(false);
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [isPlaying, step, totalSteps]);

    const handlePlayPause = () => {
        if (step >= totalSteps - 1 && !isPlaying) {
            setStep(0); // Restart if at the end
        }
        setIsPlaying(!isPlaying);
    };

    const qIndex = Math.floor(step / 3);
    const phase = step % 3; 
    // 0: Question only
    // 1: Question + Answer
    // 2: Question + Answer + Evaluation

    const currentQ = questions[qIndex];
    if (!currentQ) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-lg font-bold">Interview Replay</h2>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{session.role}</span>
                            <span>•</span>
                            <span>{session.experienceLevel}</span>
                        </div>
                    </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center gap-2 bg-card/90 p-1.5 rounded-full border border-border">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 rounded-full"
                        onClick={() => setStep(Math.max(0, step - 1))}
                        disabled={step === 0}
                    >
                        <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant="default" 
                        size="icon" 
                        className="w-10 h-10 rounded-full bg-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/90 text-white"
                        onClick={handlePlayPause}
                    >
                        {isPlaying ? <Pause className="w-5 h-5" /> : (step >= totalSteps - 1 ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />)}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 rounded-full"
                        onClick={() => setStep(Math.min(totalSteps - 1, step + 1))}
                        disabled={step >= totalSteps - 1}
                    >
                        <SkipForward className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                        {qIndex + 1} / {questions.length}
                    </span>
                    {/* Timeline progress bar */}
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-[var(--accent-teal)] transition-all duration-300"
                            style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center pb-32">
                <div className="w-full max-w-4xl space-y-6">
                    {/* Render previous questions as collapsed/mini summaries if desired, or just show current sequence */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 1. Question */}
                        <QuestionCard 
                            question={{
                                question: currentQ.questionText,
                                topic: currentQ.topic,
                                difficulty: currentQ.difficulty,
                                levelScore: currentQ.levelScore,
                                whyAsked: currentQ.whyAsked
                            }} 
                            questionNumber={qIndex + 1} 
                        />

                        {/* 2. User Answer */}
                        {(phase >= 1 || currentQ.answer) && step >= (qIndex * 3 + 1) && (
                            <div className="pl-6 md:pl-12 relative animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
                                <div className="absolute left-3 md:left-9 top-0 bottom-0 w-[2px] bg-border" />
                                <Card className="bg-muted/30 border-border/50">
                                    <CardContent className="p-5">
                                        <Badge variant="outline" className="mb-3 text-xs uppercase tracking-widest text-muted-foreground border-border">
                                            Your Answer
                                        </Badge>
                                        <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                                            {currentQ.answer?.text || "(No answer provided)"}
                                        </p>
                                    </CardContent>
                                </Card>
                                {currentQ.answer?.voiceEvaluation && currentQ.answer?.voiceMeta && (
                                    <div className="mt-4">
                                        <VoiceConfidenceCard 
                                            voiceEvaluation={currentQ.answer.voiceEvaluation} 
                                            voiceMeta={currentQ.answer.voiceMeta} 
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. Evaluation */}
                        {(phase >= 2 || currentQ.evaluation) && step >= (qIndex * 3 + 2) && currentQ.evaluation && (
                            <div className="pl-6 md:pl-12 relative animate-in fade-in slide-in-from-top-4 duration-500 delay-150">
                                <div className="absolute left-3 md:left-9 top-0 bottom-0 w-[2px] bg-border" />
                                <EvaluationCard 
                                    evaluation={currentQ.evaluation} 
                                    questionNumber={qIndex + 1} 
                                    isPro={isPro} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
