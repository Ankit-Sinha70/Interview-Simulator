# 🧠 Interview Simulator — Developer Guide

Welcome to the **Interview Simulator** developer documentation. This project is structured as a **Monorepo**, containing both the frontend and backend of the application.

## 📂 Project Structure

```text
interview-simulator/
├── frontend/             # Next.js Application (React, Tailwind, MediaPipe)
├── backend/              # Node.js API (Express, MongoDB, Claude AI)
└── DEVELOPER_GUIDE.md    # This document
```

---

## 🏗️ System Architecture

The application uses a decoupled architecture to isolate AI-driven monitoring from the core interview experience.

### 1. Frontend Subsystems (`/frontend/src`)

#### Camera Monitoring (`/components/interview/CameraMonitor`)
A parallel system that runs independently of the interview flow. Uses MediaPipe FaceMesh for real-time gaze estimation.
*   **Performance Strategy**: Processes every 2nd frame (`FRAME_SKIP: 2`) and throttles React state updates to 1s intervals.
*   **Privacy**: All AI inference is local (WASM). No video data leaves the client.

#### Interview Guard (`/hooks/useInterviewGuard.ts`)
*   **Protection**: Blocks accidental tab closes/reloads via `beforeunload`.
*   **Exit Flow**: Forces intentional exits through a custom modal.

### 2. Backend Architecture (`/backend/src`)

#### Intelligence Engine
*   **Claude Integration**: Uses Anthropic's Claude API for real-time evaluation and dynamic question generation.
*   **Session Management**: Stores session state, history, and focus statistics in MongoDB.

---

## � Getting Started (Monorepo Setup)

You will need two terminal windows open to run the full stack locally.

### Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or Atlas URI)

### 1. Start the Backend
```bash
cd backend
npm install
# Create .env with MONGODB_URI, JWT_SECRET, and CLAUDE_API_KEY
npm run dev
```

### 2. Start the Frontend
```bash
cd frontend
npm install
# Create .env with NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev
```

---

## 🔒 Ethical Safeguards

1.  **Consent First**: Users must explicitly enable monitoring via the `PrivacyModal`.
2.  **No Persistence**: Video streams are ephemeral and processed frame-by-frame; no recording happens.
3.  **Advisory Transparency**: All AI scores are labeled "Advisory" to remind users of AI stochasticity.

---

## � Performance Guide

*   **DOM Manipulation**: Draggable components use `useRef` + direct style updates for zero-lag interaction.
*   **Camera Processing**: Resolution is fixed at **640x480** to minimize GPU heat on laptops.

---

> [!TIP]
> **Debugging**: In development mode, the frontend shows a status banner at the bottom left with raw state data (`Status`, `Active`, etc.) to help verify guard logic.
