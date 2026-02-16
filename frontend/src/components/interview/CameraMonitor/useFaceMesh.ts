"use client";

import { useRef, useCallback } from "react";
import type { FaceMesh as FaceMeshType, Results } from "@mediapipe/face_mesh";

export function useFaceMesh() {
    const faceMeshRef = useRef<FaceMeshType | null>(null);

    const loadModel = useCallback(async (onResults: (results: Results) => void) => {
        if (faceMeshRef.current) return faceMeshRef.current;

        // @ts-ignore
        const FaceMesh = window.FaceMesh;
        if (!FaceMesh) throw new Error("MediaPipe FaceMesh script not loaded");

        const fm = new FaceMesh({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        fm.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        fm.onResults(onResults);
        faceMeshRef.current = fm;
        return fm;
    }, []);

    const closeModel = useCallback(() => {
        if (faceMeshRef.current) {
            faceMeshRef.current.close();
            faceMeshRef.current = null;
        }
    }, []);

    return {
        faceMeshRef,
        loadModel,
        closeModel
    };
}
