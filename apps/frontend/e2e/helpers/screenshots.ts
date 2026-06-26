import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { Page } from '@playwright/test';

const SCREENSHOT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'screenshots', 'core-modules');

let runFolder: string | null = null;

/** One folder per test run (shared across steps in the same worker). */
export function initScreenshotRun(runId?: string) {
    const stamp = runId ?? new Date().toISOString().replace(/[:.]/g, '-');
    runFolder = join(SCREENSHOT_ROOT, stamp);
    mkdirSync(runFolder, { recursive: true });
    return runFolder;
}

export function screenshotPath(stepId: string) {
    if (!runFolder) {
        initScreenshotRun();
    }
    const safe = stepId.replace(/[^a-zA-Z0-9._-]+/g, '_');
    return join(runFolder!, `${safe}.png`);
}

/** Full-page screenshot saved under e2e/screenshots/core-modules/<run>/<stepId>.png */
export async function saveStepScreenshot(page: Page, stepId: string, fullPage = true) {
    const path = screenshotPath(stepId);
    await page.screenshot({ path, fullPage });
    return path;
}