'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ActiveSessionModal from '@/components/interview/ActiveSessionModal';
import { getActiveSession, ActiveSessionResponse } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();
    const [activeSession, setActiveSession] = useState<ActiveSessionResponse | null>(null);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

    useEffect(() => {
        setMobileNavOpen(false);
    }, [pathname]);

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen">
            {!isInterviewPage && <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />}
            <main className={`flex-1 transition-[margin] duration-200 ease-in-out ${isInterviewPage ? '' : 'md:ml-72'}`}>
                {!isInterviewPage && (
                    <div className="sticky top-0 z-30 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
                        <div className="flex items-center justify-between gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-10 rounded-xl border-border/70 bg-card/70 px-3"
                                onClick={() => setMobileNavOpen(true)}
                            >
                                <Menu className="mr-2 h-4 w-4" />
                                Menu
                            </Button>
                            {user && (
                                <div className="min-w-0 text-right">
                                    <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                                    <p className="truncate text-xs text-muted-foreground">{user.planType} plan</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
