'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SessionSetup from '@/components/SessionSetup';
import { startInterview } from '@/services/api';

export default function StartInterviewPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleStart = async (role: string, level: 'Junior' | 'Mid' | 'Senior') => {
        setIsLoading(true);
        try {
            const { sessionId } = await startInterview({ role, experienceLevel: level, mode: 'text' });
            router.push(`/interview/session/${sessionId}`);
        } catch (error) {
            console.error('Failed to start interview:', error);
            setIsLoading(false);
        }
    };

    return (
        <main className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
            <SessionSetup onStart={handleStart} isLoading={isLoading} />
        </main>
    );
}
