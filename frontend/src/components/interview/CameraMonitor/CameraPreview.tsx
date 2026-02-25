"use client";

import React, { useRef, useState, useEffect } from "react";
import { useAttention } from "./AttentionContext";
import { cn } from "@/lib/utils";

export function CameraPreview() {
    const {
        isMonitoring, isModelLoaded, gazeDirection, isLookAway, stats, setIsMonitoring
    } = useAttention();

    const CAMERA_W = 320;
    const CAMERA_H = 240;

    const clampPosition = (x: number, y: number) => {
        const minX = 12;
        const maxX = window.innerWidth - CAMERA_W - 12;
        const minY = 12;
        const maxY = window.innerHeight - CAMERA_H - 12;
        return {
            x: Math.max(minX, Math.min(maxX, x)),
            y: Math.max(minY, Math.min(maxY, y)),
        };
    };

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setPosition(clampPosition(
            window.innerWidth - CAMERA_W - 20,
            window.innerHeight - CAMERA_H - 20,
        ));

        const handleResize = () => {
            setPosition((prev) => clampPosition(prev.x, prev.y));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const onMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            setPosition(clampPosition(
                e.clientX - dragStart.current.x,
                e.clientY - dragStart.current.y,
            ));
        };
        const onMouseUp = () => { isDragging.current = false; };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

    const getStatusColor = () => {
        if (!isMonitoring) return "border-zinc-700 shadow-none";
        if (!isModelLoaded) return "border-yellow-500 animate-pulse";
        if (isLookAway) return "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
        return "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]";
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "fixed z-[9999] rounded-lg overflow-hidden border-4 transition-all duration-300 bg-zinc-900 group select-none",
                getStatusColor()
            )}
            style={{
                left: position.x,
                top: position.y,
                width: 320,
                height: 240,
                cursor: isDragging.current ? "grabbing" : "grab"
            }}
            onMouseDown={onMouseDown}
        >
            {/* Status Header */}
            <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); setIsMonitoring(!isMonitoring); }}
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-800/80 text-white hover:bg-zinc-700"
                >
                    {isMonitoring ? "Pause" : "Resume"}
                </button>
                <div className="flex items-center gap-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isMonitoring ? "bg-green-500" : "bg-zinc-500")} />
                    <span className="text-[9px] text-white font-bold uppercase tracking-tighter">
                        {isMonitoring ? gazeDirection : "PAUSED"}
                    </span>
                </div>
            </div>

            {/* Privacy Disclaimer (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-white font-medium">Focus: {stats.focusScore}%</span>
                <span className="text-[8px] text-zinc-400 uppercase tracking-widest">Local Processing Only</span>
            </div>

            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                {!isMonitoring ? (
                    <span className="text-xs uppercase font-bold tracking-widest">Monitoring Disabled</span>
                ) : !isModelLoaded ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Loading AI...</span>
                    </div>
                ) : null}

            </div>
        </div>
    );
}
