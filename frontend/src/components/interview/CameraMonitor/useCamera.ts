"use client";

import { useRef, useCallback } from "react";
import { MONITOR_CONFIG } from "./constants";

export function useCamera() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: MONITOR_CONFIG.VIDEO_RES.width,
                    height: MONITOR_CONFIG.VIDEO_RES.height,
                    facingMode: "user"
                },
                audio: false
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            return stream;
        } catch (error) {
            console.error("Camera access error:", error);
            throw error;
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    return {
        videoRef,
        startCamera,
        stopCamera
    };
}
