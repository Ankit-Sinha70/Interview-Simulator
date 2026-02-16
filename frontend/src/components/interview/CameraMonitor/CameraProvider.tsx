"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useAttention, AttentionProvider } from "./AttentionContext";
import { useCamera } from "./useCamera";
import { useFaceMesh } from "./useFaceMesh";
import { useGazeDetection } from "./useGazeDetection";
import { useFocusEngine } from "./useFocusEngine";
import { MONITOR_CONFIG } from "./constants";
import Script from "next/script";

export function CameraProvider({ children }: { children: React.ReactNode }) {
    return (
        <AttentionProvider>
            <CameraManager>{children}</CameraManager>
        </AttentionProvider>
    );
}

function CameraManager({ children }: { children: React.ReactNode }) {
    const {
        isMonitoring, setIsModelLoaded, setGazeDirection, setIsLookAway, setStats
    } = useAttention();

    const { videoRef, startCamera, stopCamera } = useCamera();
    const { faceMeshRef, loadModel, closeModel } = useFaceMesh();
    const { calculateGaze, isLookingAway } = useGazeDetection();
    const { update, getStats } = useFocusEngine();

    const loopRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const lastSyncRef = useRef(0);

    const runLoop = useCallback(async () => {
        if (!isMonitoring) {
            loopRef.current = requestAnimationFrame(runLoop);
            return;
        }

        frameCountRef.current++;

        if (frameCountRef.current % MONITOR_CONFIG.FRAME_SKIP === 0) {
            if (videoRef.current && videoRef.current.readyState === 4) {
                try {
                    await faceMeshRef.current?.send({ image: videoRef.current });
                } catch (e) {
                }
            }
        }

        const now = Date.now();
        if (now - lastSyncRef.current > MONITOR_CONFIG.ENGINE.SYNC_INTERVAL) {
            setStats(getStats());
            lastSyncRef.current = now;
        }

        loopRef.current = requestAnimationFrame(runLoop);
    }, [isMonitoring, setStats, getStats, faceMeshRef]);

    const onResults = useCallback((results: any) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            setIsLookAway(true);
            update(false);
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        const direction = calculateGaze(landmarks);
        const away = isLookingAway(landmarks);

        setGazeDirection(direction);
        setIsLookAway(away);

        const isFocused = direction === "CENTER" && !away;
        update(isFocused);

        setIsModelLoaded(true);
    }, [calculateGaze, isLookingAway, update, setIsLookAway, setGazeDirection, setIsModelLoaded]);

    useEffect(() => {
        const init = async () => {
            try {
                await startCamera();
                const fm = await loadModel(onResults);
                loopRef.current = requestAnimationFrame(runLoop);
            } catch (err) {
                console.error("Initialization failed", err);
            }
        };

        init();

        return () => {
            cancelAnimationFrame(loopRef.current);
            stopCamera();
            closeModel();
        };
    }, [startCamera, loadModel, onResults, runLoop, stopCamera, closeModel]);

    return (
        <>
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
                strategy="afterInteractive"
            />
            <video
                ref={videoRef}
                className="hidden"
                playsInline
                muted
            />
            {children}
        </>
    );
}
