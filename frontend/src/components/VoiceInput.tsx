'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VoiceMetadata } from '@/services/api';

// ─── Filler Word Dictionary (matches backend) ───
const FILLER_WORDS = [
    'um', 'uh', 'uhh', 'umm', 'erm',
    'like', 'you know', 'basically', 'actually',
    'so', 'well', 'i mean', 'sort of', 'kind of',
    'right', 'okay so', 'literally',
];

function countFillerWords(text: string): number {
    const lower = text.toLowerCase();
    let count = 0;
    for (const filler of FILLER_WORDS) {
        if (filler.includes(' ')) {
            const regex = new RegExp(filler, 'gi');
            count += (lower.match(regex) || []).length;
        } else {
            const regex = new RegExp(`\\b${filler}\\b`, 'gi');
            count += (lower.match(regex) || []).length;
        }
    }
    return count;
}

interface VoiceInputProps {
    onTranscript: (transcript: string, voiceMeta: VoiceMetadata) => void;
}

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const [duration, setDuration] = useState(0);
    const recognitionRef = useRef<any>(null);
    const startTimeRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript + ' ';
                } else {
                    interimTranscript += result[0].transcript;
                }
            }
            setTranscript(finalTranscript + interimTranscript);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            // Stop recording
            recognitionRef.current.stop();
            setIsListening(false);

            if (timerRef.current) clearInterval(timerRef.current);

            const finalDuration = (Date.now() - startTimeRef.current) / 1000;

            if (transcript.trim()) {
                const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
                const wpm = finalDuration > 0 ? Math.round(wordCount / (finalDuration / 60)) : 0;
                const fillerCount = countFillerWords(transcript);

                const voiceMeta: VoiceMetadata = {
                    durationSeconds: Math.round(finalDuration * 100) / 100,
                    fillerWordCount: fillerCount,
                    pauseCount: (transcript.match(/\.{3,}|—|--|–/g) || []).length,
                    wordsPerMinute: wpm,
                };

                onTranscript(transcript.trim(), voiceMeta);
            }
        } else {
            // Start recording
            setTranscript('');
            setDuration(0);
            startTimeRef.current = Date.now();
            recognitionRef.current.start();
            setIsListening(true);

            timerRef.current = setInterval(() => {
                setDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
            }, 1000);
        }
    };

    if (!isSupported) {
        return (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[var(--accent-coral)] text-[13px] mb-4">
                ⚠️ Voice input not supported in this browser. Please use Chrome or Edge.
            </div>
        );
    }

    return (
        <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
                <Button
                    onClick={toggleListening}
                    variant="outline"
                    className={`rounded-full font-semibold text-[13px] transition-all duration-250 ${isListening
                            ? 'border-[var(--accent-coral)] text-[var(--accent-coral)] bg-red-500/10 animate-pulse-glow'
                            : 'border-[var(--accent-teal)] text-[var(--accent-teal)] bg-teal-500/10 hover:bg-teal-500/20'
                        }`}
                >
                    {isListening ? (
                        <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-[var(--accent-coral)] rounded-full animate-pulse" />
                            Stop Recording
                        </span>
                    ) : (
                        '🎤 Voice Input'
                    )}
                </Button>

                {isListening && (
                    <span className="text-[var(--accent-coral)] text-xs font-medium animate-fadeIn">
                        🔴 Recording — {duration}s
                    </span>
                )}
            </div>

            {transcript && (
                <div className="px-4 py-3 bg-teal-500/5 border border-teal-500/15 rounded-lg text-muted-foreground text-[13px] leading-relaxed italic">
                    <span className="text-[var(--accent-teal)] font-semibold not-italic">Transcript: </span>
                    {transcript}
                </div>
            )}
        </div>
    );
}
