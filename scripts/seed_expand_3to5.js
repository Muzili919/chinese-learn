// seed_expand_3to5.js
// 简易种子生成：为3-5年级扩容准备初步数据。输出到 src/data/questions_vocab.json、questions_poetry.json、questions_idiom.json、questions_sentence.json、questions_literature.json、questions_reading.json 等文件中。
// 说明：此脚本只演示性地添加少量题目，实际落地需对接到贵校的人工审核流程并扩充量级。
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readJson(p) {
  try {
    const txt = fs.readFileSync(p, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    console.warn(`Skip invalid JSON: ${p}`);
    return [];
  }
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${p} with ${data.length} items`);
}

const dataDir = path.resolve(__dirname, '../src/data');

const targets = {
  vocab: path.join(dataDir, 'questions_vocab.json'),
  poetry: path.join(dataDir, 'questions_poetry.json'),
  idiom: path.join(dataDir, 'questions_idiom.json'),
  sentence: path.join(dataDir, 'questions_sentence.json'),
  literature: path.join(dataDir, 'questions_literature.json'),
  reading: path.join(dataDir, 'questions_reading.json')
};

// 简单示例题目结构，尽量与现有字段保持一致
const newItem = (id, grade) => ({
  id: id,
  type: 'single_choice',
  question: '示例扩容题：以下哪一项符合扩展要点？',
  options: ['A. 选项A', 'B. 选项B', 'C. 选项C', 'D. 选项D'],
  answer: 'A. 选项A',
  analysis: '示例分析：此处为扩容占位示例，请人工复核',
  knowledge_tag: '示例',
  ability_tag: '扩容占位',
  difficulty: 2,
  grade: grade,
  unit: null,
  lesson: null,
  standard_code: null,
  target_id: null,
  source_year: new Date().getFullYear(),
  source_tag: null
});

function appendSeed(filePath, grade) {
  const arr = readJson(filePath) || [];
  // 简单去重：使用同名题目避免重复添加
  const exists = new Set(arr.map((x) => x.question));
  const toAdd = [newItem(`seed_${grade}_01`, grade), newItem(`seed_${grade}_02`, grade)].filter(
    (it) => !exists.has(it.question)
  );
  if (toAdd.length) {
    arr.push(...toAdd);
    writeJson(filePath, arr);
  } else {
    console.log(`No new seeds for ${path.basename(filePath)}`);
  }
}

appendSeed(targets.vocab, 3);
appendSeed(targets.poetry, 4);
appendSeed(targets.idiom, 5);
appendSeed(targets.sentence, 3);
appendSeed(targets.literature, 4);
appendSeed(targets.reading, 5);

console.log('seed_expand_3to5.js complete');
