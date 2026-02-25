"use client";

import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import { GazeDirection, AttentionStats, MonitoringState } from "./constants";

interface AttentionContextType extends MonitoringState {
    setIsMonitoring: (val: boolean) => void;
    setIsModelLoaded: (val: boolean) => void;
    setGazeDirection: (val: GazeDirection) => void;
    setIsLookAway: (val: boolean) => void;
    setStats: (stats: AttentionStats) => void;
}

const AttentionContext = createContext<AttentionContextType | null>(null);

export const useAttention = () => {
    const context = useContext(AttentionContext);
    if (!context) throw new Error("useAttention must be used within CameraProvider");
    return context;
};

export function AttentionProvider({ children }: { children: React.ReactNode }) {
    const [isMonitoring, setIsMonitoring] = useState(true);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [gazeDirection, setGazeDirection] = useState<GazeDirection>("CENTER");
    const [isLookAway, setIsLookAway] = useState(false);
    const [stats, setStats] = useState<AttentionStats>({
        focusScore: 100,
        lookAwayCount: 0,
        totalLookAwayTime: 0,
        longestLookAway: 0
    });

    return (
        <AttentionContext.Provider value={{
            isMonitoring,
            isModelLoaded,
            gazeDirection,
            isLookAway,
            stats,
            setIsMonitoring,
            setIsModelLoaded,
            setGazeDirection,
            setIsLookAway,
            setStats
        }}>
            {children}
        </AttentionContext.Provider>
    );
}
