"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import Script from "next/script";
import { GazeLogic, GazeDirection } from "./GazeLogic";
import { AttentionEngine, AttentionStats } from "./AttentionEngine";
import { StatusIndicator } from "./StatusIndicator";

// Import TYPES ONLY to avoid build issues with the UMD package
import type { FaceMesh as FaceMeshType, Results } from "@mediapipe/face_mesh";

interface EyeTrackerProps {
    onSessionEnd?: (stats: AttentionStats) => void;
    showDebugOverlay?: boolean;
    statsRef?: React.MutableRefObject<AttentionStats | null>;
}

export function EyeTracker({ onSessionEnd, showDebugOverlay = false, statsRef }: EyeTrackerProps) {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [libLoaded, setLibLoaded] = useState(false);
    const [gazeDirection, setGazeDirection] = useState<GazeDirection>("CENTER");
    const [isLookAway, setIsLookAway] = useState(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    // Lazy init engine
    const attentionEngine = useRef<AttentionEngine | null>(null);
    if (!attentionEngine.current) {
        attentionEngine.current = new AttentionEngine();
    }

    const onResults = useCallback((results: Results) => {
        if (!canvasRef.current || !webcamRef.current?.video) return;

        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        if (videoWidth === 0 || videoHeight === 0) return;

        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        ctx.save();
        ctx.clearRect(0, 0, videoWidth, videoHeight);

        // Mirror context for overlays
        ctx.translate(videoWidth, 0);
        ctx.scale(-1, 1);

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];

            // Calculate Gaze & Head Pose
            const direction = GazeLogic.calculateGaze(landmarks);
            const lookingAway = GazeLogic.isLookingAway(landmarks);

            setGazeDirection(direction);
            setIsLookAway(lookingAway);

            // Update Attention Engine
            if (attentionEngine.current) {
                const isFocused = direction === "CENTER" && !lookingAway;
                attentionEngine.current.update(isFocused);

                if (statsRef) {
                    statsRef.current = attentionEngine.current.getStats();
                }
            }

            // Draw Debug Overlay
            if (showDebugOverlay) {
                ctx.fillStyle = "#FF0000";
                const p468 = landmarks[468];
                if (p468) {
                    ctx.beginPath();
                    ctx.arc(p468.x * videoWidth, p468.y * videoHeight, 2, 0, 2 * Math.PI);
                    ctx.fill();
                }

                const p473 = landmarks[473];
                if (p473) {
                    ctx.beginPath();
                    ctx.arc(p473.x * videoWidth, p473.y * videoHeight, 2, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        } else {
            // No face detected -> Distracted/Away
            if (attentionEngine.current) {
                attentionEngine.current.update(false);
            }
            setIsLookAway(true);
        }

        ctx.restore();
    }, [showDebugOverlay, statsRef]);

    useEffect(() => {
        if (!libLoaded) return;

        console.log("EyeTracker Mounted (Effect) - Lib Loaded");

        let faceMesh: FaceMeshType | null = null;
        let animationId: number;

        const init = async () => {
            console.log("Starting FaceMesh init...");
            try {
                // @ts-ignore - Access global FaceMesh from CDN script
                const FaceMeshClass = window.FaceMesh;

                if (!FaceMeshClass) {
                    throw new Error("FaceMesh global not found. Script might not be loaded.");
                }

                faceMesh = new FaceMeshClass({
                    locateFile: (file: string) => {
                        console.log(`Loading MediaPipe file: ${file}`);
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                    },
                });

                if (!faceMesh) return;

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                faceMesh.onResults((results: Results) => {
                    if (!isModelLoaded) {
                        console.log("First FaceMesh result received!");
                        setIsModelLoaded(true);
                    }
                    onResults(results);
                });

                console.log("FaceMesh initialized. Starting loop...");

                const processVideo = async () => {
                    if (
                        webcamRef.current &&
                        webcamRef.current.video &&
                        webcamRef.current.video.readyState === 4
                    ) {
                        try {
                            // @ts-ignore
                            await faceMesh?.send({ image: webcamRef.current.video });
                        } catch (err) {
                            // Suppress frame errors, they happen
                        }
                    }
                    animationId = requestAnimationFrame(processVideo);
                };
                animationId = requestAnimationFrame(processVideo);

            } catch (error) {
                console.error("Critical FaceMesh Init Error:", error);
                setPermissionError("Failed to load AI model.");
            }
        };

        const timer = setTimeout(init, 500);

        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(animationId);
            if (faceMesh) faceMesh.close();
        };
    }, [libLoaded, onResults, isModelLoaded]); // Added dependencies

    // State for drag and resize
    const [position, setPosition] = useState({ x: 0, y: 0 }); // Will be set on mount
    const [size, setSize] = useState({ width: 320, height: 240 }); // Larger default size
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Refs for delta calculations
    const dragStartRef = useRef({ x: 0, y: 0 });
    const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
    const initialPositionSet = useRef(false);

    // Initialize position on mount (client-side only to access window)
    useEffect(() => {
        if (!initialPositionSet.current) {
            setPosition({
                x: window.innerWidth - 340, // 20px padding from right
                y: window.innerHeight - 260  // 20px padding from bottom
            });
            initialPositionSet.current = true;
        }
    }, []);

    // --- Drag Logic ---
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        // Prevent default only if it's not a touch event to allow scrolling elsewhere if needed, 
        // but here we likely want to prevent scroll while dragging the camera.
        // e.preventDefault(); 

        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        dragStartRef.current = {
            x: clientX - position.x,
            y: clientY - position.y
        };
    };

    // --- Resize Logic ---
    const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation(); // Prevent drag start
        setIsResizing(true);

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        resizeStartRef.current = {
            x: clientX,
            y: clientY,
            width: size.width,
            height: size.height
        };
    };

    // --- Global Move/Up Handlers ---
    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging && !isResizing) return;
            e.preventDefault();

            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

            if (isDragging) {
                // Calculate new position
                let newX = clientX - dragStartRef.current.x;
                let newY = clientY - dragStartRef.current.y;

                // Boundary detection
                const maxX = window.innerWidth - size.width;
                const maxY = window.innerHeight - size.height;

                newX = Math.min(Math.max(0, newX), maxX);
                newY = Math.min(Math.max(0, newY), maxY);

                setPosition({ x: newX, y: newY });
            } else if (isResizing) {
                const deltaX = clientX - resizeStartRef.current.x;
                const deltaY = clientY - resizeStartRef.current.y;

                // Min size constraints (e.g., 160x120)
                const newWidth = Math.max(160, resizeStartRef.current.width + deltaX);
                const newHeight = Math.max(120, resizeStartRef.current.height + deltaY);

                // Max size constraints (viewport)
                const safeWidth = Math.min(newWidth, window.innerWidth - position.x - 20);
                const safeHeight = Math.min(newHeight, window.innerHeight - position.y - 20);

                setSize({ width: safeWidth, height: safeHeight });
            }
        };

        const handleUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
            window.addEventListener('touchmove', handleMove, { passive: false });
            window.addEventListener('touchend', handleUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDragging, isResizing, size.width, size.height, position.x, position.y]);


    // Direct render for debugging
    return (
        <div
            className="fixed z-[99999] shadow-2xl rounded-lg overflow-hidden border-2 border-primary bg-zinc-900 group"
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                cursor: isDragging ? 'grabbing' : 'grab',
                transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease', // Disable transition during drag for performance
                touchAction: 'none' // Important for touch events
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
        >
            {/* Load MediaPipe Script */}
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
                strategy="afterInteractive"
                onLoad={() => {
                    console.log("MediaPipe Script Loaded via Next.js Script");
                    setLibLoaded(true);
                }}
            />

            <StatusIndicator status={!isModelLoaded ? "loading" : isLookAway ? "distracted" : "focused"} className="w-full h-full">
                <div className="relative w-full h-full bg-zinc-900 overflow-hidden flex items-center justify-center">

                    {permissionError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 bg-zinc-900">
                            <p className="text-red-400 text-xs font-bold mb-2">Camera Error</p>
                            <p className="text-zinc-400 text-[10px] mb-3">{permissionError}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded border border-zinc-700 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            <Webcam
                                ref={webcamRef}
                                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                                playsInline
                                width={640} // Internal resolution stays high
                                height={480}
                                onUserMedia={() => {
                                    console.log("Webcam started successfully");
                                    setPermissionError(null);
                                }}
                                onUserMediaError={(e) => {
                                    console.error("Webcam error:", e);
                                    let msg = "Could not access camera.";
                                    if (typeof e === 'string') msg = e;
                                    else if (e instanceof DOMException) {
                                        if (e.name === 'NotAllowedError') msg = "Permission denied. Allow camera access.";
                                        else if (e.name === 'NotFoundError') msg = "No camera found.";
                                        else if (e.name === 'NotReadableError') msg = "Camera is in use by another app.";
                                    }
                                    setPermissionError(msg);
                                }}
                            />

                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                            />

                            {!isModelLoaded && !permissionError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 backdrop-blur-sm z-10 p-4 text-center">
                                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2" />
                                    <p className="text-white text-xs font-medium">Initializing AI...</p>
                                </div>
                            )}

                            {/* Google Meet style overlay on hover */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-zinc-900/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-white font-medium tracking-wide">
                                    {gazeDirection}
                                </span>
                            </div>

                            {/* Resize Handle */}
                            <div
                                className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-end justify-end p-1 hover:bg-white/10 rounded-tl-lg"
                                onMouseDown={handleResizeStart}
                                onTouchStart={handleResizeStart}
                            >
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70">
                                    <path d="M8 8H0L8 0V8Z" fill="white" />
                                </svg>
                            </div>
                        </>
                    )}
                </div>
            </StatusIndicator>
        </div>
    );
}
