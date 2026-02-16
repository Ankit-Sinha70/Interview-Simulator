"use client";

import { useRef, useCallback } from "react";
import { AttentionStats, MONITOR_CONFIG } from "./constants";

export function useFocusEngine() {
    const statsRef = useRef<AttentionStats>({
        focusScore: 100,
        lookAwayCount: 0,
        totalLookAwayTime: 0,
        longestLookAway: 0
    });

    const sessionState = useRef({
        totalFrames: 0,
        focusedFrames: 0,
        isAway: false,
        awayStartTime: 0,
        lastFrameTime: 0
    });

    const update = useCallback((isFocused: boolean) => {
        const now = Date.now();
        const state = sessionState.current;

        state.totalFrames++;
        if (isFocused) {
            state.focusedFrames++;
        }

        if (!isFocused && !state.isAway) {
            state.isAway = true;
            state.awayStartTime = now;
        } else if (isFocused && state.isAway) {
            const awayDuration = now - state.awayStartTime;
            if (awayDuration > MONITOR_CONFIG.GAZE_THRESHOLDS.LOOK_AWAY_TIME) {
                statsRef.current.lookAwayCount++;
                statsRef.current.totalLookAwayTime += Math.floor(awayDuration / 1000);
                statsRef.current.longestLookAway = Math.max(
                    statsRef.current.longestLookAway,
                    Math.floor(awayDuration / 1000)
                );
            }
            state.isAway = false;
        }

        statsRef.current.focusScore = Math.round(
            (state.focusedFrames / state.totalFrames) * 100
        );

        return statsRef.current;
    }, []);

    const resetStats = useCallback(() => {
        statsRef.current = {
            focusScore: 100,
            lookAwayCount: 0,
            totalLookAwayTime: 0,
            longestLookAway: 0
        };
        sessionState.current = {
            totalFrames: 0,
            focusedFrames: 0,
            isAway: false,
            awayStartTime: 0,
            lastFrameTime: 0
        };
    }, []);

    return {
        update,
        resetStats,
        getStats: () => statsRef.current
    };
}
