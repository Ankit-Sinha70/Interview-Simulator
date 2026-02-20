'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ActiveSessionModal from '@/components/interview/ActiveSessionModal';
import { getActiveSession, ActiveSessionResponse } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();
    const [activeSession, setActiveSession] = useState<ActiveSessionResponse | null>(null);

    const isAuthPage = pathname === '/login';
    const isInterviewPage = pathname.startsWith('/interview/session');

    // ─── Global Active Session Check ───
    useEffect(() => {
        if (!user || isAuthPage || isInterviewPage) return;

        getActiveSession()
            .then((data) => {
                if (data.hasActiveSession) {
                    setActiveSession(data);
                }
            })
            .catch((err) => {
                console.error('[ClientLayout] Active session check failed:', err);
            });
    }, [user, pathname]); // re-check on navigation

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-72 transition-[margin] duration-200 ease-in-out">
                {children}
            </main>

            {/* Active Session Resume/Quit Modal */}
            {activeSession?.hasActiveSession && (
                <ActiveSessionModal
                    sessionId={activeSession.sessionId!}
                    role={activeSession.role || 'Unknown'}
                    questionCount={activeSession.questionCount || 0}
                    maxQuestions={activeSession.maxQuestions || 10}
                    onDismiss={() => setActiveSession(null)}
                />
            )}
        </div>
    );
}
