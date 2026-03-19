'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { VoiceMetadata } from '@/services/api';
import RealTimeFeedback from './RealTimeFeedback';

interface AnswerInputProps {
    sessionId: string;
    onSubmit: (answer: string, voiceMeta?: VoiceMetadata) => void;
    isLoading: boolean;
    voiceTranscript?: string;
    voiceMeta?: VoiceMetadata;
}

export default function AnswerInput({ sessionId, onSubmit, isLoading, voiceTranscript, voiceMeta }: AnswerInputProps) {
    const [answer, setAnswer] = useState('');

    React.useEffect(() => {
        if (voiceTranscript) {
            setAnswer(voiceTranscript);
        }
    }, [voiceTranscript]);

    React.useEffect(() => {
        if (sessionId && !voiceTranscript && !answer) {
            const draft = localStorage.getItem(`draft_${sessionId}`);
            if (draft) setAnswer(draft);
        }
    }, [sessionId]);

    React.useEffect(() => {
        if (sessionId) {
            localStorage.setItem(`draft_${sessionId}`, answer);
        }
    }, [answer, sessionId]);

    const handleSubmit = () => {
        if (answer.trim() && !isLoading) {
            onSubmit(answer.trim(), voiceMeta);
            setAnswer('');
            if (sessionId) localStorage.removeItem(`draft_${sessionId}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSubmit();
        }
    };

    return (
        <Card className="animate-fadeIn bg-card border-border shadow-lg mb-6">
            <CardContent className="p-6">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-[1.5px] mb-3 block">
                    Your Answer
                </Label>

                <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your answer here... (Ctrl+Enter to submit)"
                    rows={6}
                    disabled={isLoading}
                    className="w-full bg-secondary border-2 border-border text-foreground text-[15px] leading-[1.7] resize-y min-h-[140px] focus:border-[var(--accent-violet)] transition-colors"
                />

                {sessionId && (
                    <div className="h-10 mt-1 mb-2">
                        <RealTimeFeedback sessionId={sessionId} partialAnswer={answer} />
                    </div>
                )}

                <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-xs">
                            {answer.length} characters
                        </span>
                        {voiceMeta && (
                            <span className="text-[var(--accent-teal)] text-xs">
                                🎤 {voiceMeta.wordsPerMinute} WPM · {voiceMeta.fillerWordCount} fillers · {voiceMeta.durationSeconds}s
                            </span>
                        )}
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={!answer.trim() || isLoading}
                        className={`px-8 font-semibold transition-all duration-250 ${answer.trim()
                                ? 'bg-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/80 text-white'
                                : 'bg-[var(--accent-violet)]/20 text-muted-foreground cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                                Evaluating...
                            </span>
                        ) : (
                            '📤 Submit Answer'
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
