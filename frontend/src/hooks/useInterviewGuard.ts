"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export function useInterviewGuard(active: boolean) {
    const router = useRouter();
    const [showQuitModal, setShowQuitModal] = useState(false);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!active) return;

            e.preventDefault();

            const message = "Your interview is in progress. Leaving will end the session.";
            e.returnValue = message;
            return message;
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        if (active) {
            window.onbeforeunload = handleBeforeUnload;
        } else {
            window.onbeforeunload = null;
        }

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.onbeforeunload = null;
        };
    }, [active]);

    const quitInterview = useCallback(() => {
        console.log("[InterviewGuard] Opening quit modal");
        setShowQuitModal(true);
    }, []);

    const confirmQuit = useCallback(() => {
        console.log("[InterviewGuard] Quit confirmed - navigating to dashboard");
        setShowQuitModal(false);
        router.push("/dashboard");
    }, [router]);

    return {
        showQuitModal,
        setShowQuitModal,
        quitInterview,
        confirmQuit
    };
}
