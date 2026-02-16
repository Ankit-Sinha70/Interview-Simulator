export const MONITOR_CONFIG = {
    FRAME_SKIP: 2,
    VIDEO_RES: { width: 640, height: 480 },
    GAZE_THRESHOLDS: {
        HORIZONTAL: 0.35,
        VERTICAL: 0.2,
        LOOK_AWAY_TIME: 2000,
    },
    ENGINE: {
        SYNC_INTERVAL: 1000,
    }
};

export type GazeDirection = "CENTER" | "LEFT" | "RIGHT" | "UP" | "DOWN" | "AWAY";

export interface AttentionStats {
    focusScore: number;
    lookAwayCount: number;
    totalLookAwayTime: number;
    longestLookAway: number;
}

export interface MonitoringState {
    isMonitoring: boolean;
    isModelLoaded: boolean;
    gazeDirection: GazeDirection;
    isLookAway: boolean;
    stats: AttentionStats;
}
