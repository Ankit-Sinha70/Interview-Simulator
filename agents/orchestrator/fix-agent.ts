/**
 * fix-agent.ts
 *
 * Takes TypeScript compiler errors, reads the offending files,
 * and patches them. Called automatically by the orchestrator when
 * tsc --noEmit reports failures after agents write files.
 *
 * Runs in a loop (up to MAX_ATTEMPTS) until all errors are resolved.
 */

import 'cross-fetch/polyfill';
import * as fs   from 'fs';
import * as path from 'path';
import { callAgentText } from './agent.runner';
import { PROJECT_CONTEXT } from '../project.context';

const MAX_ATTEMPTS = 3;

export interface FixResult {
  fixed: boolean;
  attempts: number;
  remainingErrors: string;
}

interface ParsedError {
  filePath: string;
  line: number;
  col: number;
  code: string;
  message: string;
}

// ─── Parse tsc output into structured errors ───────────────────────────────
function parseTscErrors(tscOutput: string, projectRoot: string): ParsedError[] {
  const errors: ParsedError[] = [];
  // Format: path/to/file.ts(line,col): error TSxxxx: message
  const pattern = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(tscOutput)) !== null) {
    errors.push({
      filePath: match[1].trim(),
      line:     parseInt(match[2]),
      col:      parseInt(match[3]),
      code:     match[4],
      message:  match[5].trim(),
    });
  }
  return errors;
}

// ─── Group errors by file ──────────────────────────────────────────────────
function groupByFile(errors: ParsedError[]): Map<string, ParsedError[]> {
  const map = new Map<string, ParsedError[]>();
  for (const e of errors) {
    if (!map.has(e.filePath)) map.set(e.filePath, []);
    map.get(e.filePath)!.push(e);
  }
  return map;
}

const FIX_SYSTEM_PROMPT = `
You are a TypeScript expert fixing compiler errors in the Interview Simulator project.

${PROJECT_CONTEXT}

## Common fixes you should know

### Express route handlers
Always use explicit types — NEVER use implicit any:
\`\`\`typescript
import { Request, Response, NextFunction } from 'express';
export const myHandler = async (req: Request, res: Response, next: NextFunction) => { ... }
\`\`\`

### User model import
The user model exports \`IUser\` (interface) and \`User\` (the default mongoose model).
Correct import: \`import User, { IUser } from '../models/user.model';\`
If the error says 'User' not exported, change to: \`import User from '../models/user.model';\`

### Wrong file extension
If a React/TSX file was created as .js instead of .tsx:
- Read the .js file content
- Write the exact same content to the .tsx path
- The .js file should be deleted (write empty note about it)

### Missing type imports
Always import from the correct package:
- Express types: \`import { Request, Response, NextFunction } from 'express';\`
- Mongoose types: \`import { Document, Schema, model } from 'mongoose';\`
- React types are built-in with React 18+

## Output format
For each file that needs fixing, output:

### \`path/to/file.ts\`
\`\`\`typescript
// COMPLETE fixed file content here — not just the changed lines
\`\`\`

Output ONLY files that need changes. Do not output unchanged files.
Do not add explanations between code blocks — just the fixed files.
`;

// ─── Ask the Fix Agent to repair one batch of files ───────────────────────
async function fixBatch(
  projectRoot: string,
  errorsByFile: Map<string, ParsedError[]>,
): Promise<void> {
  // Build context: errors + current file content
  const sections: string[] = [];

  for (const [relPath, errors] of errorsByFile) {
    const absPath = path.resolve(projectRoot, relPath);

    let fileContent = '(file not found)';
    try {
      fileContent = fs.readFileSync(absPath, 'utf-8');
    } catch {}

    const errorList = errors
      .map(e => `  Line ${e.line}: [${e.code}] ${e.message}`)
      .join('\n');

    sections.push(`### File: \`${relPath}\`\nErrors:\n${errorList}\n\nCurrent content:\n\`\`\`typescript\n${fileContent}\n\`\`\``);
  }

  const userPrompt = `
Fix the following TypeScript errors.
For each file, output the COMPLETE corrected file (not just the changed lines).

${sections.join('\n\n---\n\n')}
`;

  const fixOutput = await callAgentText(FIX_SYSTEM_PROMPT, userPrompt);

  // Parse and write fixed files (same extractor as file-writer.ts)
  const pattern = /###\s+`([^`\n]+)`\s*\n```(?:\w+)?\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let filesFixed = 0;

  while ((match = pattern.exec(fixOutput)) !== null) {
    const relFilePath = match[1].trim();
    const fixedContent = match[2];

    if (!relFilePath.includes('.')) continue;

    const absPath = path.resolve(projectRoot, relFilePath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, fixedContent, 'utf-8');
    console.log(`    🔧 Fixed: ${relFilePath}`);
    filesFixed++;
  }

  if (filesFixed === 0) {
    console.log('    ⚠️  Fix Agent produced no file changes in this attempt.');
  }
}

// ─── Main fix loop ─────────────────────────────────────────────────────────
import { execSync } from 'child_process';

function runTsc(dir: string): { passed: boolean; output: string } {
  try {
    const out = execSync('npx tsc --noEmit', { cwd: dir, encoding: 'utf-8', stdio: 'pipe' }) as unknown as string;
    return { passed: true, output: out || '' };
  } catch (err: any) {
    return { passed: false, output: (err.stdout || '') + (err.stderr || '') };
  }
}

export async function runFixLoop(
  projectRoot: string,
  initialBackendErrors: string,
  initialFrontendErrors: string,
): Promise<FixResult> {
  console.log('\n🔧 Fix Agent — self-healing TypeScript errors\n');

  const backendDir  = path.join(projectRoot, 'backend');
  const frontendDir = path.join(projectRoot, 'frontend');

  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    console.log(`  ── Attempt ${attempt}/${MAX_ATTEMPTS} ──`);

    // Collect current errors from both backend and frontend
    const backendResult  = runTsc(backendDir);
    const frontendResult = runTsc(frontendDir);

    const allErrorOutput = [
      backendResult.passed  ? '' : backendResult.output,
      frontendResult.passed ? '' : frontendResult.output,
    ].join('\n').trim();

    if (backendResult.passed && frontendResult.passed) {
      console.log(`  ✅ All TypeScript errors resolved on attempt ${attempt}!`);
      return { fixed: true, attempts: attempt, remainingErrors: '' };
    }

    console.log(`  ❌ Errors remain — asking Fix Agent to patch files...`);

    // Only fix errors in files the agents actually created/modified
    // (skip pre-existing errors in untouched files by filtering to known-written paths)
    const allErrors = parseTscErrors(allErrorOutput, projectRoot);

    if (allErrors.length === 0) {
      // tsc failed for a reason other than TS errors (e.g. missing module)
      console.log(`  ⚠️  Could not parse specific errors — skipping fix attempt`);
      break;
    }

    const byFile = groupByFile(allErrors);
    console.log(`  📋 ${allErrors.length} error(s) in ${byFile.size} file(s):`);
    for (const [f, errs] of byFile) {
      console.log(`     ${f} (${errs.length} error${errs.length > 1 ? 's' : ''})`);
    }

    try {
      await fixBatch(projectRoot, byFile);
    } catch (err: any) {
      console.error(`  ❌ Fix Agent call failed: ${err.message}`);
      break;
    }

    // Small pause so file writes settle
    await new Promise(r => setTimeout(r, 1000));
  }

  // Final check
  const finalBackend  = runTsc(backendDir);
  const finalFrontend = runTsc(frontendDir);

  if (finalBackend.passed && finalFrontend.passed) {
    return { fixed: true, attempts: attempt, remainingErrors: '' };
  }

  const remaining = [
    finalBackend.passed  ? '' : finalBackend.output,
    finalFrontend.passed ? '' : finalFrontend.output,
  ].join('\n').trim();

  console.log(`\n  ⚠️  ${attempt} attempt(s) exhausted. Remaining errors:\n`);
  console.log('  ' + remaining.split('\n').slice(0, 15).join('\n  '));

  return { fixed: false, attempts: attempt, remainingErrors: remaining };
}
