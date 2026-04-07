// extend_question_fields.js
// 兼容性迁移：为现有题库条目补齐新字段（unit, lesson, standard_code, target_id, source_year, source_tag）
// 已有字段保持不变，未设置的字段将设为 null/默认值。
// 说明：此脚本仅扩展结构，不修改已有字段含义，确保向后兼容性。
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = path.resolve(__dirname, '../src/data');

function ensureFields(obj) {
  const fields = {
    unit: null,
    lesson: null,
    standard_code: null,
    target_id: null,
    source_year: new Date().getFullYear(),
    source_tag: null
  };
  // Only set if missing
  for (const k of Object.keys(fields)) {
    if (obj[k] === undefined) {
      obj[k] = fields[k];
    }
  }
  return obj;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    // skip non-JSON files
    return;
  }
  if (!Array.isArray(data)) return;
  let changed = false;
  data = data.map((item) => {
    if (typeof item !== 'object' || item === null) return item;
    const before = { ...item };
    item = ensureFields(item);
    if (JSON.stringify(before) !== JSON.stringify(item)) changed = true;
    return item;
  });
  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkDir(p);
    } else if (e.isFile() && p.endsWith('.json')) {
      processFile(p);
    }
  }
}

walkDir(dataDir);
console.log('extend_question_fields.js complete');
