"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export function useInterviewGuard(active: boolean) {
    const router = useRouter();
    const [showQuitModal, setShowQuitModal] = useState(false);

    useEffect(() => {
        if (!active) {
            console.log("[InterviewGuard] Not active, omitting listeners");
            return;
        }

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            console.log("[InterviewGuard] beforeunload triggered! active:", active);
            e.preventDefault();
            e.returnValue = "Are you sure you want to leave?";
            return e.returnValue;
        };

        console.log("[InterviewGuard] ATTACHING reload protection");
        window.addEventListener("beforeunload", handleBeforeUnload, { capture: true });
        window.onbeforeunload = handleBeforeUnload;

        return () => {
            console.log("[InterviewGuard] DETACHING reload protection");
            window.removeEventListener("beforeunload", handleBeforeUnload, { capture: true });
            window.onbeforeunload = null;
        };
    }, [active]);

    const quitInterview = useCallback(() => {
        console.log("[InterviewGuard] quitInterview action called");
        setShowQuitModal(true);
    }, []);

    const confirmQuit = useCallback(() => {
        console.log("[InterviewGuard] confirmQuit action - redirecting");
        setShowQuitModal(false);
        router.push("/");
    }, [router]);

    return {
        showQuitModal,
        setShowQuitModal,
        quitInterview,
        confirmQuit
    };
}
