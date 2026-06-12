#!/usr/bin/env node
/**
 * Generates localization catalog module files from embedded message trees.
 * Run: node scripts/generate-catalog-modules.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, '../src/lib/localization/messages');

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

function writeModule(locale, name, constName, tree) {
    const dir = path.join(messagesDir, locale);
    fs.mkdirSync(dir, { recursive: true });
    const content = `export const ${constName} = ${serializeValue(tree)} as const;\n`;
    fs.writeFileSync(path.join(dir, `${name}.ts`), content, 'utf8');
}

// Import EN trees from separate data file would be cleaner; embedded here for single-script run.
import { enTrees, bnTrees, msTrees } from './catalog-data.mjs';

for (const [name, tree] of Object.entries(enTrees)) {
    writeModule('en', name, tree.constName, tree.messages);
}
for (const [name, tree] of Object.entries(bnTrees)) {
    writeModule('bn', name, tree.constName, tree.messages);
}
for (const [name, tree] of Object.entries(msTrees)) {
    writeModule('ms', name, tree.constName, tree.messages);
}

console.log('Generated catalog modules for en, bn, ms');