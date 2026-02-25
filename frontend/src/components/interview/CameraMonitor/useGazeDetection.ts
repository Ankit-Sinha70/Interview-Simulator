"use client";

import type { NormalizedLandmarkList } from "@mediapipe/face_mesh";
import { useCallback } from "react";
import { GazeDirection } from "./constants";

export function useGazeDetection() {
    const calculateGaze = useCallback((landmarks: NormalizedLandmarkList): GazeDirection => {
        if (!landmarks || landmarks.length < 478) return "AWAY";

        const leftIris = landmarks[468];
        const rightIris = landmarks[473];

        const leftEyeOuter = landmarks[33];
        const leftEyeInner = landmarks[133];
        const rightEyeInner = landmarks[362];
        const rightEyeOuter = landmarks[263];
        const horizontalRatio = (leftIris.x - leftEyeOuter.x) / (leftEyeInner.x - leftEyeOuter.x);

        const leftEyeTop = landmarks[159];
        const leftEyeBottom = landmarks[145];
        const verticalRatio = (leftIris.y - leftEyeTop.y) / (leftEyeBottom.y - leftEyeTop.y);

        if (horizontalRatio < 0.35) return "RIGHT";
        if (horizontalRatio > 0.65) return "LEFT";
        if (verticalRatio < 0.2) return "UP";
        if (verticalRatio > 0.8) return "DOWN";

        return "CENTER";
    }, []);

    const isLookingAway = useCallback((landmarks: NormalizedLandmarkList): boolean => {
        if (!landmarks || landmarks.length === 0) return true;

        const nose = landmarks[1];
        const leftEar = landmarks[234];
        const rightEar = landmarks[454];

        const horizontalCenter = (leftEar.x + rightEar.x) / 2;
        const totalWidth = Math.abs(rightEar.x - leftEar.x);
        const yawOffset = (nose.x - horizontalCenter) / totalWidth;

        if (Math.abs(yawOffset) > 0.15) return true;

        return false;
    }, []);

    return {
        calculateGaze,
        isLookingAway
    };
}
