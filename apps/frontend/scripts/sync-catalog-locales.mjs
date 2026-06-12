#!/usr/bin/env node
/**
 * Deep-merge English catalog structure into bn/ms, preserving existing translations.
 * Run: npx tsx scripts/sync-catalog-locales.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, '../src/lib/localization/messages');

const MODULES = [
    ['core', 'coreMessages'],
    ['sales', 'salesMessages'],
    ['purchases', 'purchasesMessages'],
    ['accounting', 'accountingMessages'],
    ['customers', 'customersMessages'],
    ['inventoryExtras', 'inventoryExtrasMessages'],
    ['crmHr', 'crmHrMessages'],
    ['admin', 'adminMessages'],
    ['storefront', 'storefrontMessages'],
    ['marketing', 'marketingMessages'],
    ['settingsExtras', 'settingsExtrasMessages'],
    ['reports', 'reportsMessages'],
    ['components', 'componentsMessages'],
    ['help', 'helpMessages'],
];

function serializeValue(value, indent = 4) {
    const pad = ' '.repeat(indent);
    const padInner = ' '.repeat(indent + 4);
    if (typeof value === 'string') {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        if (typeof value[0] === 'string') {
            return `[\n${value.map((v) => `${padInner}${JSON.stringify(v)},`).join('\n')}\n${pad}]`;
        }
        return `[\n${value.map((v) => `${padInner}${serializeValue(v, indent + 4)},`).join('\n')}\n${pad}]`;
    }
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return `{\n${entries
        .map(([k, v]) => {
            const key = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : JSON.stringify(k);
            return `${padInner}${key}: ${serializeValue(v, indent + 4)},`;
        })
        .join('\n')}\n${pad}}`;
}

function deepMergeStructure(base, overlay) {
    if (typeof base === 'string') {
        return typeof overlay === 'string' ? overlay : base;
    }
    if (Array.isArray(base)) {
        return Array.isArray(overlay) ? overlay : base;
    }
    if (!base || typeof base !== 'object') {
        return overlay ?? base;
    }
    const out = {};
    for (const key of Object.keys(base)) {
        out[key] = deepMergeStructure(base[key], overlay?.[key]);
    }
    return out;
}

async function loadModule(locale, file, constName) {
    const mod = await import(path.join(messagesDir, locale, `${file}.ts`));
    return mod[constName];
}

for (const locale of ['bn', 'ms']) {
    for (const [file, constName] of MODULES) {
        const enPath = path.join(messagesDir, 'en', `${file}.ts`);
        const localePath = path.join(messagesDir, locale, `${file}.ts`);
        if (!fs.existsSync(enPath)) continue;

        const enMod = await import(enPath);
        const localeMod = fs.existsSync(localePath) ? await import(localePath) : { [constName]: {} };
        const merged = deepMergeStructure(enMod[constName], localeMod[constName]);
        const content = `export const ${constName} = ${serializeValue(merged)} as const;\n`;
        fs.writeFileSync(localePath, content, 'utf8');
        console.log(`Synced ${locale}/${file}.ts`);
    }
}

console.log('Catalog locale sync complete.');