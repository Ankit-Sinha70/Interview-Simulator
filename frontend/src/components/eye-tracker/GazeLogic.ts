import { NormalizedLandmark } from "@mediapipe/face_mesh";

export type GazeDirection = "CENTER" | "LEFT" | "RIGHT" | "UP" | "DOWN";

// Key landmarks for eyes
const LEFT_EYE_IRIS = 468;
const LEFT_EYE_LEFT = 33;
const LEFT_EYE_RIGHT = 133;

const RIGHT_EYE_IRIS = 473;
const RIGHT_EYE_LEFT = 362;
const RIGHT_EYE_RIGHT = 263;

// Key landmarks for head pose (approximate)
const NOSE_TIP = 1;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;

export class GazeLogic {
    static calculateGaze(landmarks: NormalizedLandmark[]): GazeDirection {
        if (!landmarks || landmarks.length < 468) return "CENTER";

        const leftGaze = this.getHorizontalRatio(
            landmarks[LEFT_EYE_LEFT],
            landmarks[LEFT_EYE_RIGHT],
            landmarks[LEFT_EYE_IRIS]
        );

        const rightGaze = this.getHorizontalRatio(
            landmarks[RIGHT_EYE_LEFT],
            landmarks[RIGHT_EYE_RIGHT],
            landmarks[RIGHT_EYE_IRIS]
        );

        // Average the ratios
        const avgRatio = (leftGaze + rightGaze) / 2;

        if (avgRatio < 0.35) return "RIGHT"; // Mirrored: User looks right -> Iris moves left in camera
        if (avgRatio > 0.65) return "LEFT";

        // Vertical Gaze (Simplified for now, can be expanded)
        // Here we would need top/bottom eyelid landmarks
        // For MVP, focus on horizontal as it's the main "reading off screen" indicator.

        return "CENTER";
    }

    static isLookingAway(landmarks: NormalizedLandmark[]): boolean {
        if (!landmarks || landmarks.length < 468) return false;

        // 1. Check Head Pose
        const nose = landmarks[NOSE_TIP];
        const leftCheek = landmarks[LEFT_CHEEK];
        const rightCheek = landmarks[RIGHT_CHEEK];

        // Simple Yaw Check: Ratio of nose to cheeks
        const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
        const noseToLeft = Math.abs(nose.x - leftCheek.x);
        const yawRatio = noseToLeft / faceWidth;

        // If nose is too close to one cheek, head is turned
        if (yawRatio < 0.25 || yawRatio > 0.75) {
            return true; // Head turned significantly
        }

        // 2. Check Gaze (if head is straight but eyes are side-eyeing)
        const gaze = this.calculateGaze(landmarks);
        if (gaze !== "CENTER") {
            return true;
        }

        return false;
    }

    private static getHorizontalRatio(
        p1: NormalizedLandmark,
        p2: NormalizedLandmark,
        iris: NormalizedLandmark
    ): number {
        // Distance 1: Iris to outer corner (p1)
        const d1 = Math.abs(iris.x - p1.x);
        // Total eye width
        const width = Math.abs(p2.x - p1.x);

        if (width === 0) return 0.5;

        return d1 / width;
    }
}
