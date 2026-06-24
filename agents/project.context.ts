/**
 * project.context.ts
 *
 * Builds a DYNAMIC context string by scanning the real project files at runtime.
 * This grounds every agent in actual evidence — file extensions, import patterns,
 * existing component names — so agents can't hallucinate conventions.
 *
 * Instead of: "the project uses TypeScript" (static claim agents can ignore)
 * We inject:  "existing files are QuestionCard.tsx, AnswerInput.tsx..." (proof)
 */

import * as fs   from 'fs';
import * as path from 'path';

export const ROOT_DIR = process.cwd().endsWith('agents')
  ? path.resolve(__dirname, '..')
  : process.cwd();

// ─── Filesystem scanner helpers ───────────────────────────────────────────────

function listFiles(dir: string, ext: string, maxDepth = 2): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  function walk(current: string, depth: number) {
    if (depth > maxDepth) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.next') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (entry.name.endsWith(ext)) results.push(path.relative(ROOT_DIR, full));
    }
  }
  walk(dir, 0);
  return results;
}

function readFirst10Lines(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8').split('\n').slice(0, 10).join('\n');
  } catch { return ''; }
}

// ─── Build dynamic context ────────────────────────────────────────────────────

function buildProjectContext(): string {
  const backendSrc  = path.join(ROOT_DIR, 'backend', 'src');
  const frontendSrc = path.join(ROOT_DIR, 'frontend', 'src');

  // Scan real file lists
  const controllers  = listFiles(path.join(backendSrc, 'controllers'),  '.ts',  1).map(f => path.basename(f));
  const services     = listFiles(path.join(backendSrc, 'services'),      '.ts',  1).map(f => path.basename(f));
  const routes       = listFiles(path.join(backendSrc, 'routes'),        '.ts',  1).map(f => path.basename(f));
  const models       = listFiles(path.join(backendSrc, 'models'),        '.ts',  1).map(f => path.basename(f));
  const aiEngines    = listFiles(path.join(backendSrc, 'ai'),            '.ts',  1).map(f => path.basename(f));
  const components   = listFiles(path.join(frontendSrc, 'components'),   '.tsx', 2).map(f => path.basename(f));
  const pages        = listFiles(path.join(frontendSrc, 'app'),          '.tsx', 3).map(f => path.relative(path.join(frontendSrc, 'app'), path.join(ROOT_DIR, f)));

  // Detect actual file extensions in use
  const allFrontendFiles = listFiles(frontendSrc, '.tsx', 4).concat(listFiles(frontendSrc, '.ts', 4)).concat(listFiles(frontendSrc, '.js', 4));
  const tsxCount  = allFrontendFiles.filter(f => f.endsWith('.tsx')).length;
  const tsCount   = allFrontendFiles.filter(f => f.endsWith('.ts')).length;
  const jsCount   = allFrontendFiles.filter(f => f.endsWith('.js')).length;

  // Sample a real controller to show import patterns
  const sampleController = path.join(backendSrc, 'controllers', 'auth.controller.ts');
  const controllerSample = readFirst10Lines(sampleController);

  // Sample a real component to show frontend patterns
  const sampleComponent = path.join(frontendSrc, 'components', 'QuestionCard.tsx');
  const componentSample = readFirst10Lines(sampleComponent);

  // Read tsconfig to show strict settings
  let tsconfigBackend = '{}';
  try { tsconfigBackend = fs.readFileSync(path.join(ROOT_DIR, 'backend', 'tsconfig.json'), 'utf-8'); } catch {}

  // Read user model to show exact exports
  const userModelPath = path.join(backendSrc, 'models', 'user.model.ts');
  const userModelTop  = readFirst10Lines(userModelPath);

  return `
# Project: AI Interview Simulator
# ⚠️  This context is DYNAMICALLY GENERATED from real project files at ${new Date().toISOString()}
# Do NOT deviate from the patterns shown — they are derived from actual source files.

## File Extension Rules — ENFORCED BY EVIDENCE
Frontend file count: ${tsxCount} .tsx files, ${tsCount} .ts files, ${jsCount} .js files
✅ ALWAYS use .tsx for React components and pages
✅ ALWAYS use .ts for non-JSX TypeScript files (hooks, utils, types)
❌ NEVER create .js or .jsx files — the project has ${jsCount} .js files and they are NOT components

## Backend — Express + TypeScript + MongoDB

### Controllers (${controllers.length} existing)
${controllers.join(', ')}

### Real controller pattern — copy this EXACTLY:
\`\`\`typescript
${controllerSample}
\`\`\`
✅ Always import: import { Request, Response, NextFunction } from 'express';
✅ Always export named async functions
❌ NEVER use implicit any on req, res, next parameters

### Services (${services.length} existing)
${services.join(', ')}

### Routes (${routes.length} existing)
${routes.join(', ')}

### Models (${models.length} existing)
${models.join(', ')}

### User model exports — CRITICAL
\`\`\`typescript
${userModelTop}
\`\`\`
✅ Correct import: import User, { IUser } from '../models/user.model';
❌ Wrong import:   import { User } from '../models/user.model';  ← TS2724 error

### AI Engines (${aiEngines.length} existing)
${aiEngines.join(', ')}
All AI calls: import { callAI } from '../ai/provider.factory';

## Frontend — Next.js 16 + React 19 + TypeScript + Tailwind CSS v4

### Components (${components.length} existing .tsx files)
${components.join(', ')}

### Real component pattern — copy this EXACTLY:
\`\`\`tsx
${componentSample}
\`\`\`
✅ Always add 'use client'; at top for interactive components
✅ Always use React.FC<Props> or explicit prop types
✅ Tailwind CSS classes only — no inline styles
✅ import { toast } from 'sonner' for notifications
✅ import { IconName } from 'lucide-react' for icons
❌ NEVER use useState<any> — always type the state

## Backend tsconfig (strict mode settings)
\`\`\`json
${tsconfigBackend.slice(0, 500)}
\`\`\`

## Architecture rules
- Backend pattern: routes → controllers → services → AI engines
- All AI calls go through provider.factory.ts callAI<T>()
- Subscription gating via LockedSection component
- Auth: import { authenticateToken } from '../middlewares/auth.middleware'
- Response shape: { success: true, data: ... } or { success: false, message: ... }
- Environment vars: MONGODB_URI, JWT_SECRET, GEMINI_API_KEY (backend); NEXT_PUBLIC_API_URL (frontend)
`;
}

// Build once at import time — all agents share the same snapshot
export const PROJECT_CONTEXT = buildProjectContext();
