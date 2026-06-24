/**
 * test-runner.ts
 *
 * Runs validation checks after agents write files:
 *  1. TypeScript type check (tsc --noEmit) on backend and frontend
 *  2. Jest tests if they exist
 *
 * Returns a pass/fail result so the git pipeline can decide whether to push.
 */

import { execSync, ExecSyncOptions } from 'child_process';
import * as path from 'path';

export interface TestResult {
  passed: boolean;
  steps: Array<{
    name: string;
    passed: boolean;
    output: string;
  }>;
}

function run(cmd: string, cwd: string): { passed: boolean; output: string } {
  const opts: ExecSyncOptions = { cwd, encoding: 'utf-8', stdio: 'pipe' };
  try {
    const output = execSync(cmd, opts) as unknown as string;
    return { passed: true, output: output || '(no output)' };
  } catch (err: any) {
    const output = (err.stdout || '') + (err.stderr || '') || err.message;
    return { passed: false, output };
  }
}

export function runTests(projectRoot: string): TestResult {
  const steps: TestResult['steps'] = [];
  const backendDir  = path.join(projectRoot, 'backend');
  const frontendDir = path.join(projectRoot, 'frontend');

  console.log('\n🧪 Test Runner — validating generated code\n');

  // ── Step 1: Backend TypeScript check ────────────────────────────────────────
  console.log('  📘 Backend TypeScript check...');
  const backendTsc = run('npx tsc --noEmit', backendDir);
  steps.push({ name: 'Backend TypeScript', passed: backendTsc.passed, output: backendTsc.output });
  console.log(`  ${backendTsc.passed ? '✅' : '❌'} Backend TS: ${backendTsc.passed ? 'clean' : 'errors found'}`);
  if (!backendTsc.passed) console.log('     ' + backendTsc.output.split('\n').slice(0, 8).join('\n     '));

  // ── Step 2: Frontend TypeScript check ───────────────────────────────────────
  console.log('  📘 Frontend TypeScript check...');
  const frontendTsc = run('npx tsc --noEmit', frontendDir);
  steps.push({ name: 'Frontend TypeScript', passed: frontendTsc.passed, output: frontendTsc.output });
  console.log(`  ${frontendTsc.passed ? '✅' : '❌'} Frontend TS: ${frontendTsc.passed ? 'clean' : 'errors found'}`);
  if (!frontendTsc.passed) console.log('     ' + frontendTsc.output.split('\n').slice(0, 8).join('\n     '));

  // ── Step 3: Backend Jest tests (if configured) ───────────────────────────────
  const backendPkg = require(path.join(backendDir, 'package.json'));
  if (backendPkg.scripts?.test) {
    console.log('  🧪 Backend Jest tests...');
    const jestResult = run('npm test -- --passWithNoTests --forceExit', backendDir);
    steps.push({ name: 'Backend Jest', passed: jestResult.passed, output: jestResult.output });
    console.log(`  ${jestResult.passed ? '✅' : '❌'} Backend tests: ${jestResult.passed ? 'passed' : 'failed'}`);
    if (!jestResult.passed) console.log('     ' + jestResult.output.split('\n').slice(0, 10).join('\n     '));
  } else {
    console.log('  ℹ️  No backend test script found — skipping Jest');
    steps.push({ name: 'Backend Jest', passed: true, output: 'skipped (no test script)' });
  }

  const allPassed = steps.every(s => s.passed);
  console.log(`\n  ${allPassed ? '✅ All checks passed' : '❌ Some checks failed — review before pushing'}`);

  return { passed: allPassed, steps };
}
