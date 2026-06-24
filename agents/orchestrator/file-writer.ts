/**
 * file-writer.ts
 *
 * Parses the markdown output from specialist agents, extracts code blocks
 * with their target file paths, and writes them to disk.
 *
 * Agent output format it understands:
 *   ### `path/to/file.tsx`
 *   ```tsx
 *   // code here
 *   ```
 *
 * Also handles:
 *   ### `path/to/file.ts`
 *   ```typescript
 *   // code here
 *   ```
 */

import * as fs from 'fs';
import * as path from 'path';

export interface WrittenFile {
  filePath: string;
  linesWritten: number;
  isNew: boolean;
}

/**
 * Parse agent markdown output and extract { filePath, code } pairs.
 */
function extractFilesFromOutput(output: string): Array<{ filePath: string; code: string }> {
  const files: Array<{ filePath: string; code: string }> = [];

  // Match: ### `some/path/file.ext`  followed by a fenced code block
  // Handles optional language tag: ```tsx, ```typescript, ```ts, ```js, etc.
  const pattern = /###\s+`([^`\n]+\.\w+)`\s*\n```(?:\w+)?\n([\s\S]*?)```/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(output)) !== null) {
    const filePath = match[1].trim();
    const code     = match[2]; // preserve exact content including trailing newline

    // Skip paths that look like inline examples (no directory separator and no extension)
    if (!filePath.includes('.')) continue;

    files.push({ filePath, code });
  }

  return files;
}

/**
 * Write all files extracted from agent outputs to the project root.
 * Creates parent directories automatically.
 */
export function writeAgentFiles(
  agentOutputs: string[],
  projectRoot: string,
): WrittenFile[] {
  const written: WrittenFile[] = [];
  const seen = new Set<string>(); // deduplicate if multiple agents touch the same file

  for (const output of agentOutputs) {
    const extracted = extractFilesFromOutput(output);

    for (const { filePath, code } of extracted) {
      if (seen.has(filePath)) {
        console.log(`  ⚠️  Skipping duplicate: ${filePath}`);
        continue;
      }
      seen.add(filePath);

      const absPath = path.resolve(projectRoot, filePath);
      const isNew   = !fs.existsSync(absPath);

      // Create parent directories if needed
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      fs.writeFileSync(absPath, code, 'utf-8');

      const linesWritten = code.split('\n').length;
      written.push({ filePath, linesWritten, isNew });

      const tag = isNew ? '🆕' : '✏️ ';
      console.log(`  ${tag} ${isNew ? 'Created' : 'Updated'}: ${filePath} (${linesWritten} lines)`);
    }
  }

  return written;
}

/**
 * Print a summary of what was written.
 */
export function printWriteSummary(files: WrittenFile[]): void {
  if (files.length === 0) {
    console.log('  ℹ️  No files were extracted from agent output.');
    console.log('     Agents may have produced recommendations without code blocks.');
    return;
  }

  const newCount     = files.filter(f => f.isNew).length;
  const updatedCount = files.length - newCount;
  console.log(`\n  📁 Files written: ${files.length} total (${newCount} new, ${updatedCount} updated)`);
}
