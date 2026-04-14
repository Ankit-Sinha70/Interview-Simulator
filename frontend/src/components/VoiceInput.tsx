'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VoiceMetadata } from '@/services/api';

type SpeechRecognitionLike = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult?: (event: { results?: Array<{ isFinal?: boolean; 0?: { transcript?: string } }> }) => void;
    onerror?: (e?: unknown) => void;
    onend?: () => void;
};

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
    const [isSupported, setIsSupported] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
        return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
    });
    const [duration, setDuration] = useState(0);
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const startTimeRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const win = window as unknown as {
            SpeechRecognition?: new () => SpeechRecognitionLike;
            webkitSpeechRecognition?: new () => SpeechRecognitionLike;
        };

        const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) {
            return;
        }

        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const results = event.results;
            let finalTranscript = '';
            let interimTranscript = '';
            if (results) {
                for (let i = 0; i < results.length; i++) {
                    const result = results[i];
                    const transcript = (result && result[0] && result[0].transcript) || '';
                    if (result && result.isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
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
