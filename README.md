# 🧠 Ai - Interview Simulator 

Welcome to the **Interview Simulator** developer documentation. This guide explains the core architecture, subsystems, and performance strategies used in this application.

## 🏗️ System Architecture

The application is built with a decoupled architecture, isolating the **Interview Logic** from the **Monitoring Subsystem**.

### 1. Camera Monitoring Subsystem (`/components/interview/CameraMonitor`)
A parallel system that runs independently of the interview flow. Uses MediaPipe FaceMesh for real-time gaze estimation.

*   **`CameraProvider`**: The global controller. Manages the `requestAnimationFrame` loop and initializes models.
*   **`AttentionContext`**: Distributes focus scores and gaze data using React Context to avoid prop-drilling.
*   **Performance Strategy**: 
    *   **Frame Skipping**: Processes every 2nd frame (`FRAME_SKIP: 2`).
    *   **Throttled Updates**: Syncs statistical state to React every 1 second to minimize re-renders.
    *   **Local Processing**: All AI inference happens in the browser via WebAssembly. No video is ever sent to the backend.

### 2. Interview Guard System (`/hooks/useInterviewGuard.ts`)
Protects the session integrity by preventing accidental data loss.

*   **`beforeunload` Protection**: Attaches native browser listeners to block accidental tab close or reloads during active sessions.
*   **Quit Flow**: Replaces standard "Finish" buttons with a high-stakes "Quit Interview" modal to ensure intentional exits.

### 3. Intelligence Layer (`/hooks/useActiveSession.ts`)
Manages the state of the interview itself (questions, answers, evaluations).

*   **State Machine**: Tracks `LOADING` → `READY` → `COMPLETED`.
*   **Stat Sync**: Automatically attaches `AttentionStats` (focus scores) to the final interview completion payload.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS |
| **AI / ML** | MediaPipe FaceMesh (v0.4), WebAssembly |
| **UI Components** | Radix UI, Shadcn/UI, Lucide React |
| **Animations** | Framer Motion |
| **Backend** | Node.js (Express), MongoDB (Mongoose) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or via Atlas)

### Local Setup
1.  **Clone the repo**
2.  **Frontend Setup**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
3.  **Backend Setup**:
    ```bash
    cd backend
    npm install
    npm run dev
    ```

### Environment Variables
**Frontend**: `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
**Backend**: `MONGODB_URI`, `JWT_SECRET`, `CLAUDE_API_KEY`

---

## 🔒 Ethical Safeguards & Privacy

1.  **Privacy Disclosure**: Every session starts with a `PrivacyModal` requiring user consent.
2.  **Local Inference**: The app strictly uses client-side WASM for facial landmark detection.
3.  **Advisory Label**: All AI-generated results are explicitly labeled as "Advisory Only" to manage user expectations.

---

## 🏎️ Performance Optimizations

*   **Ref-based Interactions**: Draggable/Resizable windows use `useRef` and direct DOM mutation (`element.style`) for 60FPS performance, bypassing the React reconciliation loop during movement.
*   **Webcam Resolution**: Locked at **640x480** to balance detection accuracy with CPU/GPU thermal impact.

---

> [!TIP]
> When modifying the gaze detection logic, refer to `useGazeDetection.ts`. It uses normalized landmark ratios which are resistant to varying screen sizes.
