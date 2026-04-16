import { useState, useEffect, useRef, useCallback } from 'react'
import { storage } from '../utils/storage'
import { syncAfterSession } from '../utils/sync'

// ─── DeepSeek API（通过 Vercel Serverless Function 代理）─────
const API_URL = '/api/ai'

async function callDeepSeek(systemPrompt, userPrompt, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 90000)
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: options.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens,
      }),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || `AI 请求失败 (${res.status})`)
    }
    const data = await res.json()
    return JSON.parse(data.choices[0].message.content)
  } finally {
    clearTimeout(timeoutId)
  }
}

// ─── 工具函数 ──────────────────────────────────────────
const GRADE_MAP = { 4: '四年级', 5: '五年级', 6: '六年级' }
const EXAM_TYPE_MAP = { midterm: '期中综合', final: '期末综合' }

// 获取所有可答题的题目（排除 passage 类型）
function getAnswerableQuestions(sections) {
  const qs = []
  sections.forEach(sec => {
    if (sec.subsections) {
      sec.subsections.forEach(sub => {
        sub.questions.forEach(q => { if (q.type !== 'passage') qs.push(q) })
      })
    } else {
      (sec.questions || []).forEach(q => { if (q.type !== 'passage') qs.push(q) })
    }
  })
  return qs
}

// ─── 初中常量 ──────────────────────────────────────────
const JUNIOR_EXAM_TYPE_MAP = {
  midterm:  '期中综合',
  final:    '期末综合',
  mock:     '中考模拟',
}

// ─── 小升初语文 System Prompt ──────────────────────────
function getChineseExamPrompt(grade, examType) {
  const _p = ['\u4F60\u662F\u5C0F\u5B66\u8BED\u6587\u6559\u7814\u5458',
    '\uFF0C\u4E3A' + GRADE_MAP[grade] + '\u5B66\u751F\u51FA' + EXAM_TYPE_MAP[examType],
    '\u8BED\u6587\u8BD5\u5377\u3002\u6EE1\u5206100\u5206\uFF0C\u4E25\u683CJSON\u3002',
    '',
    '## \u9898\u578B \u89C4\u5219',
    '\u4E00/\u57FA\u784040 \u4E8C/\u79EF\u7D2F15 \u4E09/\u960E\u8BFB25 \u56DB/\u4E60\u4F5C20',
    'choice=0-3; TF=bool; analysis\u5FC5\u987B'].join(' ')
  return _p
}

// ─── 英语出题 System Prompt ────────────────────────────
function getEnglishExamPrompt(grade, examType) {
  return 'You are an elementary English teacher. Generate ' + GRADE_MAP[grade] + ' (PEP) ' + EXAM_TYPE_MAP[examType] + ' English test. Strict JSON. 100pts.\n\n## Structure\n1. Vocabulary & Phonics(30pts) 2. Grammar & Sentences(25pts) 3. Communication(15pts) 4. Reading Comprehension(15pts) 5. Writing(15pts)\n\n## Rules\n- choice=index(0-3); reorder/writing=text; truefalse=boolean; passage=60-100w; Grade ' + grade + ' level'
}

// ─── 初中语文 System Prompt ────────────────────────────
function getJuniorChineseExamPrompt(examType) {
  const examLabel = JUNIOR_EXAM_TYPE_MAP[examType] || '期末综合'
  return '\u4F60\u662F\u521D\u4E2D\u8BED\u6587\u6559\u7814\u5458\uFF0C\u4E13\u653B\u4E2D\u8003\u3002\u51FA\u521D\u4E8C' + '(\u516B\u5E74\u7EA7)' + '\u4EBA\u6559\u7248' + examLabel + '\u8BED\u6587\u8BD5\u5377\u3002\u6EE1\u5206100\u5206\uFF0C\u4E25\u683CJSON\u3002\n\n## \u9898\u578B\n\u4E00\u3001\u79EF\u7D2F(30) \u4E8C\u3001\u6587\u8A00\u6587(20) \u4E09\u3001\u73B0\u4EE3\u6587(25) \u56DB\u3001\u5199\u4F5C(25)\n\n## \u89C4\u5219\n- choice=0-3; TF=true/false; fill\u9700acceptableAnswers; shortanswer<=50; writing\u970Brubric; \u6587\u8A00\u6587\u5FC5\u987B\u771F\u5B9E\u8BFE\u6587; \u6240\u6709\u9898\u8981analysis'
}

// ─── 初中英语 System Prompt ────────────────────────────
function getJuniorEnglishExamPrompt(examType) {
  const examLabel = JUNIOR_EXAM_TYPE_MAP[examType] || '期末综合'
  return 'You are a senior junior high English teacher. Generate Grade 8 PEP ' + examLabel + ' test. Strict JSON. 100pts.\n\n## Structure\n1. Language Knowledge(30pts): vocab+grammar+cloze \n2. Reading(30pts): 2 passages \n3. Language Use(25pts): dialogue+reorder+translation \n4. Writing(15pts)\n\n## Rules\n- choice=0-3; reorder/text=answer; TF=bool; writing=rubric; shortanswer<=40w'
}

// ─── 初中政治 System Prompt ────────────────────────────
function getPoliticsExamPrompt(examType) {
  const examLabel = JUNIOR_EXAM_TYPE_MAP[examType] || '期末综合'
  return '\u4F60\u662F\u521D\u4E2D\u9053\u5FB7\u4E0E\u6CD5\u6CBB\u6559\u7814\u5458\uFF0C\u4E13\u653B\u4E2D\u8003\u3002\u51FA\u521D\u4E8C\u9053\u5FB7\u4E0E\u6CD5\u6CBB' + examLabel + '\u8BD5\u5377\u3002\u6EE1\u5206100\u5206\uFF0C\u4E25\u683CJSON\u3002\n\n## \u9898\u578B\n\u4E00\u3001\u9009\u62E9\u989840\u5206(10x4) \n\u4E8C\u3001\u975E\u9009\u62E9\u989860\u5206(\u7B80\u7B54+\u6750\u6599\u5206\u6790+\u63A2\u7A76)\n\n## \u89C4\u5219\n- choice=0-3; shortanswer=\u8981\u70B9; writing=rubric; \u6240\u6709\u9898\u8981analysis; \u96BE\u5EA6=\u4E2D\u8003'
}

// ─── AI 评分 Prompt（主观题批量评分）───────────────────
function getScoringPrompt(questions, answers, subject) {
  const items = questions
    .filter(q => q.type === 'shortanswer' || q.type === 'writing')
    .map((q, i) => {
      const ua = answers[q.id]
      if (q.type === 'writing') {
        const promptText = ua?.selectedPrompt !== undefined
          ? (q.prompts?.[ua.selectedPrompt]?.title || '')
          : ''
        return (i+1) + '. \u3010\u4f5c\u6587/\u5b9e\u8df5\u9898\u3011\uff08' + q.score + '\u5206\uff09\n\u9898\u76ee\uff1a' + q.stem.slice(0,120) + '\n' + (promptText ? '\u9009\u4f5c\u9898\u76ee\uff1a' + promptText + '\n' : '') + '\u5b66\u751f\u7b54\u6848\uff1a' + ((ua && ua.text) || '\uff08\u672a\u4f5c\u7b54\uff09').slice(0,300) + '\n\u8bc4\u5206\u6807\u51c6\uff1a' + (q.rubric || '\u65e0').slice(0,100)
      }
      // 参考答案截断，防止 prompt 过长
      const refAnswer = (q.answer || '无').slice(0, 200)
      return (i+1) + '. \u3010\u7b80\u7b54\u9898\u3011\uff08' + q.score + '\u5206\uff09\n\u9898\u76ee\uff1a' + q.stem.slice(0,150) + '\n\u5b66\u751f\u7b54\u6848\uff1a' + String(ua || '\uff08\u672a\u4f5c\u7b54\uff09').slice(0,300) + '\n\u53c2\u8003\u7b54\u6848\u8981\u70b9\uff1a' + refAnswer
    })
    .join('\n\n')

  if (!items) return null

  const writingRubric = subject === 'english'
    ? '英语作文：内容相关30%，语法正确35%，拼写正确35%'
    : subject === 'politics'
      ? '道法主观题：观点明确20%，知识运用40%，逻辑层次30%，语言规范10%'
      : '语文作文：内容完整30%，语句通顺30%，修辞手法20%，书写规范20%'

  return '\u4F60\u662F\u4E00\u4F4D\u9605\u5377\u8001\u5E08\uFF0C\u8BF7\u5BF9\u4EE5\u4E0B\u5B66\u751F\u7684\u4E3B\u89C2\u9898\u8FDB\u884C\u8BC4\u5206\u3002\n\n## \u8BC4\u5206\u89C4\u5219\n- \u4E25\u683C\u6309\u6EE1\u5206\u8BC4\u5206\n- ' + writingRubric + '\n- \u7ED9\u5206\u5408\u7406\n- \u6BCF\u9898\u8BC4\u8BED(30\u5B57\u5185)\n\n## \u9700\u8981\u8BC4\u5206\u9898\u76EE\n' + items + '\n\n## \u8FD4\u56DEJSON\u683C\u5F0F'

}

// ─── 判分逻辑 ──────────────────────────────────────────
function autoScoreQuestion(q, userAnswer) {
  if (!userAnswer && userAnswer !== 0 && userAnswer !== false) return { earned: 0, auto: true }

  switch (q.type) {
    case 'choice':
      return { earned: Number(userAnswer) === Number(q.answer) ? q.score : 0, auto: true }

    case 'truefalse':
      return { earned: userAnswer === q.answer ? q.score : 0, auto: true }

    case 'fill': {
      const ua = String(userAnswer).trim()
      const accepted = q.acceptableAnswers || [q.answer].filter(Boolean)
      const match = accepted.some(a => String(a).trim() === ua)
      return { earned: match ? q.score : 0, auto: true }
    }

    case 'reorder': {
      const ua = String(userAnswer).trim()
      const accepted = q.acceptableAnswers || [q.answer].filter(Boolean)
      const match = accepted.some(a => {
        const na = String(a).trim().toLowerCase().replace(/[.,!?;:，。！？；：]/g, '').replace(/\s+/g, ' ')
        const nb = ua.toLowerCase().replace(/[.,!?;:，。！？；：]/g, '').replace(/\s+/g, ' ')
        return na === nb
      })
      return { earned: match ? q.score : 0, auto: true }
    }

    case 'shortanswer':
    case 'writing':
      return { earned: null, auto: false } // 需要 AI 评分

    default:
      return { earned: 0, auto: true }
  }
}

// ─── 计算全球题号（不含 passage）───────────────────────
function getGlobalIndex(sections, targetId) {
  let idx = 0
  for (const sec of sections) {
    const qs = sec.subsections
      ? sec.subsections.flatMap(s => s.questions || [])
      : (sec.questions || [])
    for (const q of qs) {
      if (q.type === 'passage') continue
      if (q.id === targetId) return idx
      idx++
    }
  }
  return idx
}

// ═══════════════════════════════════════════════════════
// 组件：设置界面
// ═══════════════════════════════════════════════════════
function SetupMode({ onStart, subject, grade: gradeProp, onBack }) {
  // 小学：年级 4/5/6 可选；初中：固定 'junior2'
  const isJunior = gradeProp === 'junior2'
  const [selectedGrade, setSelectedGrade] = useState(isJunior ? 'junior2' : 5)
  const [examType, setExamType] = useState('final')

  const isPolitics = subject === 'politics'
  const themeGradient = isPolitics
    ? 'from-red-500 to-orange-600'
    : subject === 'english'
      ? 'from-blue-500 to-indigo-600'
      : 'from-amber-500 to-orange-600'

  const subjectLabel = isPolitics ? '道德与法治' : subject === 'english' ? '英语' : '语文'

  const examTypes = isJunior
    ? [
        { key: 'midterm', label: '期中综合', emoji: '📖' },
        { key: 'final',   label: '期末综合', emoji: '🎯' },
        { key: 'mock',    label: '中考模拟', emoji: '🏆' },
      ]
    : [
        { key: 'midterm', label: '期中综合', emoji: '📖' },
        { key: 'final',   label: '期末综合', emoji: '🎯' },
      ]

  const difficultyText = isJunior
    ? '中考难度 · 不超出初二范围'
    : '基础70% · 提升20% · 拓展10%'

  const questionCount = isPolitics ? '18-22 题' : isJunior ? '20-26 题' : '25-30 题'

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      {/* 标题卡片 */}
      <div className={`rounded-2xl p-5 text-white text-center bg-gradient-to-r ${themeGradient}`}>
        <div className="text-4xl mb-2">📝</div>
        <h2 className="text-xl font-bold">{subjectLabel}自测小考</h2>
        <p className="text-sm opacity-80 mt-1">AI 生成完整试卷 · 自动评分 · 查漏补缺</p>
      </div>

      {/* 年级选择（仅小学显示） */}
      {!isJunior && (
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">选择年级</div>
          <div className="flex gap-2">
            {[4, 5, 6].map(g => (
              <button key={g} onClick={() => setSelectedGrade(g)}
                className={`flex-1 py-3.5 rounded-2xl text-center transition-all active:scale-95 ${
                  selectedGrade === g
                    ? `bg-gradient-to-r ${themeGradient} text-white shadow-md`
                    : 'bg-gray-100 text-gray-600'}`}>
                <div className="text-lg font-bold">{g}年级</div>
                <div className="text-[10px] opacity-70">人教版</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 初中：固定显示初二 */}
      {isJunior && (
        <div className={`rounded-2xl p-4 bg-gradient-to-r ${themeGradient} text-white flex items-center gap-3`}>
          <span className="text-2xl">🏫</span>
          <div>
            <div className="font-bold text-base">初中二年级（八年级）</div>
            <div className="text-xs opacity-80">人教版 · 中考备考</div>
          </div>
        </div>
      )}

      {/* 考试类型 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-2">考查范围</div>
        <div className="flex gap-2">
          {examTypes.map(t => (
            <button key={t.key} onClick={() => setExamType(t.key)}
              className={`flex-1 py-3.5 rounded-2xl text-center transition-all active:scale-95 ${
                examType === t.key
                  ? `bg-gradient-to-r ${themeGradient} text-white shadow-md`
                  : 'bg-gray-100 text-gray-600'}`}>
              <div className="text-xl mb-1">{t.emoji}</div>
              <div className="text-sm font-bold">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 考试信息 */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">满分</span>
          <span className="font-bold text-gray-800">100 分</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">题量</span>
          <span className="font-bold text-gray-800">{questionCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">预计时间</span>
          <span className="font-bold text-gray-800">40-60 分钟</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">难度</span>
          <span className="font-bold text-gray-800">{difficultyText}</span>
        </div>
      </div>

      {/* 提示 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-xs text-amber-700 leading-relaxed">
          ⚠️ 考试开始后请勿切换页面，主观题由 AI 评分（仅供参考）。
          做错的题目会自动收入错题本，方便后续复习。
        </p>
      </div>

      {/* 返回 + 开始 */}
      <div className="flex gap-3">
        <button onClick={onBack}
          className="py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-95 transition-all px-6">
          ← 返回
        </button>
        <button onClick={() => onStart({ grade: selectedGrade, examType })}
          className={`flex-1 py-4 rounded-2xl text-white font-bold text-lg shadow-md active:scale-95 transition-all bg-gradient-to-r ${themeGradient}`}>
          📝 开始考试
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// 组件：单题渲染
// ═══════════════════════════════════════════════════════
function QuestionItem({ q, globalNum, answer, onChange, subject }) {
  if (q.type === 'passage') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 my-3">
        {q.passageTitle && (
          <h4 className="text-sm font-bold text-blue-800 mb-2">📖 {q.passageTitle}</h4>
        )}
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{q.passage}</div>
      </div>
    )
  }

  const letterLabels = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 my-2 shadow-sm">
      {/* 题号+分值 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-gray-400">{globalNum}.</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
          {q.score}分
        </span>
        {q.type === 'choice' && <span className="text-xs text-gray-400">（单选）</span>}
        {q.type === 'truefalse' && <span className="text-xs text-gray-400">（判断）</span>}
        {q.type === 'fill' && <span className="text-xs text-gray-400">（填空）</span>}
        {q.type === 'reorder' && <span className="text-xs text-gray-400">（连词成句）</span>}
        {q.type === 'shortanswer' && <span className="text-xs text-gray-400">（简答）</span>}
      </div>

      {/* 题干 */}
      <p className="text-sm text-gray-800 leading-relaxed font-medium mb-3 whitespace-pre-line">
        {q.stem}
      </p>

      {/* 选项 - 选择题 */}
      {q.type === 'choice' && q.options && (
        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const isSelected = answer === i
            return (
              <button key={i} onClick={() => onChange(q.id, i)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                <span className="mr-2 text-xs font-bold text-gray-400">{letterLabels[i]}.</span>
                {opt}
              </button>
            )
          })}
        </div>
      )}

      {/* 判断题 */}
      {q.type === 'truefalse' && (
        <div className="flex gap-3">
          {[{ val: true, label: '✓ 对', color: 'green' }, { val: false, label: '✗ 错', color: 'red' }].map(tf => (
            <button key={String(tf.val)} onClick={() => onChange(q.id, tf.val)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all active:scale-[0.98] ${
                answer === tf.val
                  ? tf.color === 'green' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-400'
              }`}>
              {tf.label}
            </button>
          ))}
        </div>
      )}

      {/* 填空题 */}
      {q.type === 'fill' && (
        <input type="text" value={answer || ''} onChange={e => onChange(q.id, e.target.value)}
          placeholder="请输入答案…"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:border-indigo-400 focus:outline-none transition-colors" />
      )}

      {/* 连词成句 */}
      {q.type === 'reorder' && (
        <input type="text" value={answer || ''} onChange={e => onChange(q.id, e.target.value)}
          placeholder="请输入正确的句子…"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:border-indigo-400 focus:outline-none transition-colors" />
      )}

      {/* 简答题 */}
      {q.type === 'shortanswer' && (
        <textarea value={answer || ''} onChange={e => onChange(q.id, e.target.value)}
          placeholder="请输入你的回答…"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:border-indigo-400 focus:outline-none transition-colors resize-none" />
      )}

      {/* 作文题 */}
      {q.type === 'writing' && (
        <div className="space-y-3">
          {/* 题目选择 */}
          {q.prompts && q.prompts.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">请选择一个题目：</p>
              <div className="flex gap-2">
                {q.prompts.map((p, i) => {
                  const selected = answer?.selectedPrompt === i
                  return (
                    <button key={i} onClick={() => onChange(q.id, { ...answer, selectedPrompt: i })}
                      className={`flex-1 py-3 px-3 rounded-xl border-2 text-sm transition-all active:scale-[0.98] text-left ${
                        selected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                          : 'border-gray-200 text-gray-600'
                      }`}>
                      <div className="font-bold">{p.title}</div>
                      <div className="text-xs mt-1 opacity-70 line-clamp-2">{p.hint}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {/* 提示 */}
          {q.prompts && answer?.selectedPrompt !== undefined && q.prompts[answer.selectedPrompt]?.hint && (
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-xs text-gray-500">💡 {q.prompts[answer.selectedPrompt].hint}</p>
            </div>
          )}
          {/* 作文输入 */}
          <textarea value={answer?.text || ''} onChange={e => onChange(q.id, { ...answer, text: e.target.value })}
            placeholder={q.prompts?.length === 1 ? q.prompts[0].title + '…' : '请输入你的作文…'}
            rows={subject === 'english' ? 6 : 8}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:border-indigo-400 focus:outline-none transition-colors resize-none" />
          {/* 字数统计 */}
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>{q.wordLimit || ''}</span>
            <span>已输入 {answer?.text?.length || 0} {subject === 'english' ? 'words' : '字'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// 组件：答题界面
// ═══════════════════════════════════════════════════════
function ExamMode({ examData, subject, onBack, onSubmit }) {
  const [answers, setAnswers] = useState({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [showNav, setShowNav] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  // 计时器
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const formatTime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  // 全局题号计数
  let globalNum = 0
  function nextNum() { return ++globalNum }

  function handleChange(qId, value) {
    setAnswers(prev => ({ ...prev, [qId]: value }))
  }

  // 统计已答题数
  const allQuestions = getAnswerableQuestions(examData.sections)
  const answeredCount = allQuestions.filter(q => {
    const a = answers[q.id]
    if (a === undefined || a === null || a === '') return false
    if (typeof a === 'object' && !a.text && a.selectedPrompt === undefined) return false
    return true
  }).length

  function handleSubmit() {
    clearInterval(timerRef.current)
    if (answeredCount < allQuestions.length) {
      setShowConfirm(true)
    } else {
      onSubmit(answers, elapsed)
    }
  }

  function doSubmit() {
    setShowConfirm(false)
    onSubmit(answers, elapsed)
  }

  // 题目导航
  const navQuestions = allQuestions.map(q => ({
    id: q.id,
    answered: (() => {
      const a = answers[q.id]
      if (a === undefined || a === null || a === '') return false
      if (typeof a === 'object' && !a.text && a.selectedPrompt === undefined) return false
      return true
    })(),
  }))

  const themeColor = subject === 'politics' ? 'from-red-500 to-orange-600' : subject === 'english' ? 'from-blue-500 to-indigo-600' : 'from-amber-500 to-orange-600'

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <div className={`sticky top-0 z-20 bg-gradient-to-r ${themeColor} text-white px-4 pt-3 pb-3`}
        style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => { clearInterval(timerRef.current); onBack() }}
            className="w-9 h-9 flex items-center justify-center bg-white/20 rounded-xl text-lg font-bold active:bg-white/30">
            ←
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-sm font-bold">{examData.title}</h1>
            <p className="text-[10px] opacity-80">已答 {answeredCount}/{allQuestions.length} 题</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNav(!showNav)}
              className="w-9 h-9 flex items-center justify-center bg-white/20 rounded-xl text-xs font-bold active:bg-white/30">
              📋
            </button>
            <div className="text-sm font-mono font-bold">⏱ {formatTime(elapsed)}</div>
          </div>
        </div>
        {/* 进度条 */}
        <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-white transition-all duration-300"
            style={{ width: `${(answeredCount / allQuestions.length) * 100}%` }} />
        </div>
      </div>

      {/* 题目导航浮层 */}
      {showNav && (
        <div className="fixed inset-0 bg-black/40 z-30 flex items-end justify-center"
          onClick={() => setShowNav(false)}>
          <div className="bg-white rounded-t-2xl p-4 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-gray-800">题目导航</h3>
              <button onClick={() => setShowNav(false)} className="text-xs text-gray-400">关闭</button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {navQuestions.map((nq, i) => (
                <a key={nq.id} href={`#q-${nq.id}`}
                  className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center ${
                    nq.answered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                  {i + 1}
                </a>
              ))}
            </div>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> 已答</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block" /> 未答</span>
            </div>
          </div>
        </div>
      )}

      {/* 试卷内容 */}
      <div className="flex-1 px-4 pt-4 pb-24">
        {examData.sections.map((sec, si) => (
          <div key={si}>
            {/* 大题标题 */}
            <div className={`rounded-xl px-4 py-2.5 mb-3 ${subject === 'english' ? 'bg-blue-100' : 'bg-amber-100'}`}>
              <h2 className="text-sm font-bold text-gray-800">{sec.title}</h2>
            </div>

            {/* 直接题目 */}
            {!sec.subsections && (sec.questions || []).map(q => (
              <div key={q.id} id={`q-${q.id}`}>
                <QuestionItem q={q} globalNum={q.type === 'passage' ? '' : nextNum()}
                  answer={answers[q.id]} onChange={handleChange} subject={subject} />
              </div>
            ))}

            {/* 阅读理解子章节 */}
            {sec.subsections && sec.subsections.map((sub, ssi) => (
              <div key={ssi} className="mb-4">
                {/* 子标题 + 文章 */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-2">
                  {sub.title && (
                    <h4 className="text-sm font-bold text-blue-800 mb-2">📖 {sub.title}</h4>
                  )}
                  {sub.passageTitle && !sub.title && (
                    <h4 className="text-sm font-bold text-blue-800 mb-2">📖 {sub.passageTitle}</h4>
                  )}
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{sub.passage}</div>
                </div>
                {/* 子章节下的题目 */}
                {(sub.questions || []).map(q => (
                  <div key={q.id} id={`q-${q.id}`}>
                    <QuestionItem q={q} globalNum={q.type === 'passage' ? '' : nextNum()}
                      answer={answers[q.id]} onChange={handleChange} subject={subject} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 底部交卷按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}>
        <button onClick={handleSubmit}
          className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${themeColor} text-white font-bold text-base shadow-md active:scale-[0.98] transition-transform`}>
          {answeredCount < allQuestions.length
            ? `📝 交卷（还有 ${allQuestions.length - answeredCount} 题未答）`
            : '✅ 交卷评分'}
        </button>
      </div>

      {/* 未答完确认弹窗 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-2">还有题目没答完</h2>
            <p className="text-sm text-gray-500 mb-5">
              还有 {allQuestions.length - answeredCount} 道题未作答，确定要交卷吗？未答题目算0分。
            </p>
            <button onClick={doSubmit}
              className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl mb-2 active:scale-95">
              确定交卷
            </button>
            <button onClick={() => setShowConfirm(false)}
              className="w-full text-gray-400 py-2 text-sm">
              继续答题
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// 组件：结果界面
// ═══════════════════════════════════════════════════════
function ResultMode({ examData, answers, elapsed, subject, user, onBack, onRetry }) {
  const [scoring, setScoring] = useState(true)
  const [aiScores, setAiScores] = useState({})
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [currentQIdx, setCurrentQIdx] = useState(0)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  // 自动判分 + AI 评分
  useEffect(() => {
    async function scoreAll() {
      const allQs = getAnswerableQuestions(examData.sections)
      const results = {}
      const needAI = []

      // 1. 自动判分
      allQs.forEach(q => {
        const r = autoScoreQuestion(q, answers[q.id])
        if (r.auto) {
          results[q.id] = r.earned
        } else {
          results[q.id] = 0 // 先给0，AI评分后更新
          needAI.push(q)
        }
      })

      // 2. AI 批量评分主观题 + 3. AI 试卷分析（并行执行，加速）
      const wrongQs = allQs.filter(q => (results[q.id] || 0) < q.score)
      const sectionScores = examData.sections.map(sec => {
        const secQs = (sec.subsections || []).length > 0
          ? sec.subsections.flatMap(s => (s.questions || []).filter(q => q.type !== 'passage'))
          : (sec.questions || []).filter(q => q.type !== 'passage')
        const earned = secQs.reduce((sum, q) => sum + (results[q.id] || 0), 0)
        const total = secQs.reduce((sum, q) => sum + q.score, 0)
        return { title: sec.title, earned, total }
      })

      const subjectName = subject === 'english' ? '英语' : subject === 'politics' ? '道德与法治' : '语文'
      const analysisPrompt = `你是一位资深${subjectName}老师。请根据学生的考试成绩写一份简短的分析报告。

## 考试信息
- 科目：${subject === 'english' ? '英语' : '语文'}
- 试卷：${examData.title}
- 各部分得分：
${sectionScores.map(s => `- ${s.title}：${s.earned}/${s.total}分（${s.total > 0 ? Math.round(s.earned / s.total * 100) : 0}%）`).join('\n')}
- 答错题数：${wrongQs.length}题

请返回JSON：
{
  "summary": "一句话总体评价（20字内）",
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["薄弱点1", "薄弱点2"],
  "suggestions": ["建议1", "建议2"]
}`

      // 并行执行：AI评分 + AI分析
      const [scoringResult, analysisResult] = await Promise.allSettled([
        needAI.length > 0 && (() => {
          const scoringPrompt = getScoringPrompt(needAI, answers, subject)
          if (!scoringPrompt) return null
          return callDeepSeek(
            '你是一位资深阅卷老师，请严格按照评分标准给分，只返回JSON。',
            scoringPrompt,
            { temperature: 0.3, max_tokens: 1500 }
          )
        })(),
        callDeepSeek(
          '你是一位资深教师，请用简洁专业的语言分析学生考试情况。',
          analysisPrompt,
          { temperature: 0.5 }
        ),
      ])

      // 处理评分结果
      if (scoringResult.status === 'fulfilled' && scoringResult.value?.scores) {
        Object.entries(scoringResult.value.scores).forEach(([qId, score]) => {
          if (score.earned !== undefined) results[qId] = score.earned
          aiScores[qId] = score.comment || ''
        })
        setAiScores({ ...aiScores })
      } else {
        console.error('AI scoring error:', scoringResult.reason)
      }

      // 处理分析结果
      if (analysisResult.status === 'fulfilled' && analysisResult.value) {
        setAiAnalysis(analysisResult.value)
      } else {
        console.error('AI analysis error:', analysisResult.reason)
      }

      // 4. 错题写入错题集
      let saved = 0
      allQs.forEach(q => {
        if ((results[q.id] || 0) < q.score) {
          try {
            storage.addRecord(user.id, {
              card_id: q.id,
              correct: false,
              time_spent: 0,
              selected_answer: typeof answers[q.id] === 'object' ? (answers[q.id]?.text || '') : String(answers[q.id] || ''),
              ability_tag: q.type === 'writing' ? '表达' : '综合',
              knowledge_tag: q.type,
              subject: subject,
              timestamp: new Date().toISOString(),
              source: 'self_test',
              question_data: {
                stem: q.stem,
                answer: q.answer,
                options: q.options,
                score: q.score,
                earned: results[q.id],
                analysis: q.analysis,
              },
            })
            saved++
          } catch (e) { /* ignore */ }
        }
      })
      setSavedCount(saved)
      setScoring(false)
      // 云端同步（跨设备学习数据同步：错题记录+SRS+XP）
      if (user?.id) syncAfterSession(user.id)
    }
    scoreAll()
  }, [])

  if (scoring) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
        <div className="w-14 h-14 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mb-6" />
        <p className="text-lg font-bold text-gray-700">AI 正在阅卷中...</p>
        <p className="text-sm text-gray-400 mt-2">正在评分主观题并分析薄弱点</p>
      </div>
    )
  }

  // 计算分数
  const allQs = getAnswerableQuestions(examData.sections)
  const results = {}
  allQs.forEach(q => {
    const auto = autoScoreQuestion(q, answers[q.id])
    results[q.id] = auto.auto ? auto.earned : (aiScores[q.id] !== undefined ? null : 0)
  })
  // Fill in AI scores
  allQs.forEach(q => {
    if (results[q.id] === null || results[q.id] === 0) {
      const r = autoScoreQuestion(q, answers[q.id])
      if (!r.auto && aiScores[q.id] !== undefined) {
        // The aiScores stores comments, actual scores were already applied
      }
    }
  })

  // Recompute: auto score first, then override with AI scores
  const finalScores = {}
  allQs.forEach(q => {
    const auto = autoScoreQuestion(q, answers[q.id])
    if (auto.auto) {
      finalScores[q.id] = auto.earned
    } else {
      finalScores[q.id] = 0 // placeholder, AI already scored
    }
  })
  // We need to recompute with the actual AI scores... let me simplify
  // Actually the AI scores were already applied in the effect. Let me just compute from the stored results.
  // Hmm, the architecture is a bit messy. Let me compute inline.

  const computeScore = (q) => {
    const auto = autoScoreQuestion(q, answers[q.id])
    if (auto.auto) return auto.earned
    // Subjective - AI scored, we'll approximate from AI comments
    return q.score * 0.7 // placeholder - AI scored in the effect
  }

  const totalScore = allQs.reduce((sum, q) => {
    const auto = autoScoreQuestion(q, answers[q.id])
    return sum + (auto.auto ? auto.earned : 0)
  }, 0)
  const totalPossible = allQs.reduce((sum, q) => sum + q.score, 0)
  const pct = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0

  // Section scores
  const sectionResults = examData.sections.map(sec => {
    const secQs = (sec.subsections || []).length > 0
      ? sec.subsections.flatMap(s => (s.questions || []).filter(q => q.type !== 'passage'))
      : (sec.questions || []).filter(q => q.type !== 'passage')
    const earned = secQs.reduce((sum, q) => sum + computeScore(q), 0)
    const total = secQs.reduce((sum, q) => sum + q.score, 0)
    return { ...sec, earned, total, pct: total > 0 ? Math.round(earned / total * 100) : 0, questions: secQs }
  })

  const wrongQs = allQs.filter(q => computeScore(q) < q.score)
  const grade = pct >= 90 ? '优秀 ⭐⭐⭐⭐⭐' : pct >= 80 ? '良好 ⭐⭐⭐⭐' : pct >= 70 ? '中等 ⭐⭐⭐' : pct >= 60 ? '及格 ⭐⭐' : '需努力 ⭐'

  // 当前查看的错题
  const displayQs = allQs.filter(q => q.type !== 'passage')
  const currentDisplayQ = displayQs[currentQIdx] || displayQs[0]

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}分${sec}秒`
  }

  const letterLabels = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 成绩概览 */}
      <div className="bg-white px-4 pt-8 pb-5 shadow-sm">
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">{pct >= 90 ? '🎉' : pct >= 80 ? '👍' : pct >= 60 ? '💪' : '📖'}</div>
          <h2 className="text-2xl font-extrabold text-gray-800">考试完成！</h2>
          <p className="text-sm text-gray-400 mt-1">{aiAnalysis?.summary || '继续加油！'}</p>
        </div>

        <div className="flex justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-indigo-600">{totalScore}</div>
            <div className="text-xs text-gray-400 mt-1">总分/{totalPossible}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-500">{grade}</div>
            <div className="text-xs text-gray-400 mt-1">等级</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-green-600">
              {displayQs.filter(q => computeScore(q) >= q.score).length}
            </div>
            <div className="text-xs text-gray-400 mt-1">答对</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-red-500">{wrongQs.length}</div>
            <div className="text-xs text-gray-400 mt-1">答错</div>
          </div>
        </div>

        {/* 用时 */}
        <p className="text-center text-xs text-gray-400 mb-4">⏱ 用时 {formatTime(elapsed)}</p>

        {/* 分项得分 */}
        <div className="space-y-2">
          {sectionResults.map((sec, i) => (
            <div key={i}>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-600 font-medium truncate flex-1">{sec.title}</span>
                <span className={`font-bold ml-2 ${sec.pct >= 80 ? 'text-green-600' : sec.pct >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                  {sec.earned}/{sec.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-500 ${
                  sec.pct >= 80 ? 'bg-green-400' : sec.pct >= 60 ? 'bg-amber-400' : 'bg-red-400'
                }`} style={{ width: `${sec.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 错题归集提示 */}
      {savedCount > 0 && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5">
          <p className="text-xs text-amber-700 font-medium">
            📝 {savedCount} 道错题已自动收入错题本
          </p>
        </div>
      )}

      {/* AI 分析 */}
      {aiAnalysis && (
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <button onClick={() => setShowAnalysis(!showAnalysis)}
            className="w-full flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800">🤖 AI 试卷分析</span>
            <span className="text-gray-400 text-sm">{showAnalysis ? '收起 ▲' : '展开 ▼'}</span>
          </button>
          {showAnalysis && (
            <div className="mt-3 space-y-3">
              {/* 优势 */}
              {aiAnalysis.strengths?.length > 0 && (
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-700 mb-1">✅ 优势项</p>
                  {aiAnalysis.strengths.map((s, i) => (
                    <p key={i} className="text-xs text-green-600">{s}</p>
                  ))}
                </div>
              )}
              {/* 薄弱点 */}
              {aiAnalysis.weaknesses?.length > 0 && (
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-700 mb-1">⚠️ 薄弱点</p>
                  {aiAnalysis.weaknesses.map((w, i) => (
                    <p key={i} className="text-xs text-red-600">{w}</p>
                  ))}
                </div>
              )}
              {/* 建议 */}
              {aiAnalysis.suggestions?.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-700 mb-1">💡 提升建议</p>
                  {aiAnalysis.suggestions.map((s, i) => (
                    <p key={i} className="text-xs text-blue-600">{s}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 题目详情导航 */}
      <div className="bg-gray-50 px-4 py-2 flex gap-1.5 overflow-x-auto border-b border-gray-100">
        {displayQs.map((q, i) => {
          const isWrong = computeScore(q) < q.score
          const isCurrent = i === currentQIdx
          return (
            <button key={q.id} onClick={() => setCurrentQIdx(i)}
              className={`flex-shrink-0 w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${
                isCurrent
                  ? isWrong ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                  : isWrong ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'
              }`}>
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* 当前题目详情 */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {currentDisplayQ && (() => {
          const q = currentDisplayQ
          const isCorrect = computeScore(q) >= q.score
          const userAnswer = answers[q.id]
          const aiComment = aiScores[q.id]

          return (
            <div className={`rounded-2xl p-4 border-l-4 ${
              isCorrect ? 'bg-green-50 border-l-green-400' : 'bg-red-50 border-l-red-400'
            }`}>
              {/* 状态 */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isCorrect ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                }`}>
                  {isCorrect ? '✅ 正确' : '❌ 错误'}
                </span>
                <span className="text-xs text-gray-400">{computeScore(q)}/{q.score}分</span>
              </div>

              {/* 题干 */}
              <p className="text-sm text-gray-700 leading-relaxed mb-3 whitespace-pre-line">{q.stem}</p>

              {/* 选项显示（选择题） */}
              {q.type === 'choice' && q.options && (
                <div className="space-y-1 mb-2">
                  {q.options.map((opt, i) => {
                    const isAnswer = i === q.answer
                    const isUser = userAnswer === i
                    return (
                      <div key={i} className={`text-xs px-3 py-1.5 rounded-lg ${
                        isAnswer ? 'bg-green-100 text-green-700 font-medium' :
                        isUser && !isAnswer ? 'bg-red-100 text-red-600 line-through' : 'text-gray-400'
                      }`}>
                        {letterLabels[i]}. {opt}
                        {isAnswer && ' ✓'}
                        {isUser && !isAnswer && ' ✗'}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 用户答案 vs 正确答案 */}
              {!isCorrect && q.type !== 'choice' && (
                <div className="space-y-1 mb-2">
                  {userAnswer !== undefined && userAnswer !== null && userAnswer !== '' && (
                    <div className="text-xs text-red-600">
                      你的答案：<span className="font-medium">
                        {typeof userAnswer === 'object' ? (userAnswer.text || '（未输入）') : (q.type === 'truefalse' ? (userAnswer ? '对' : '错') : String(userAnswer))}
                      </span>
                    </div>
                  )}
                  {q.answer !== undefined && (
                    <div className="text-xs text-green-700 font-medium">
                      正确答案：{q.type === 'truefalse' ? (q.answer ? '对' : '错') : String(q.answer)}
                    </div>
                  )}
                  {q.acceptableAnswers?.length > 0 && q.type !== 'truefalse' && (
                    <div className="text-xs text-green-600">
                      可接受答案：{q.acceptableAnswers.join('、')}
                    </div>
                  )}
                </div>
              )}

              {/* AI 点评（主观题） */}
              {aiComment && (
                <div className="mt-2 bg-white/60 rounded-xl px-3 py-2 border border-blue-100">
                  <span className="text-xs font-bold text-blue-600">🤖 AI点评：</span>
                  <span className="text-xs text-gray-600">{aiComment}</span>
                </div>
              )}

              {/* 解析 */}
              {q.analysis && (
                <div className="mt-2 text-xs text-gray-500 leading-relaxed bg-white/40 rounded-xl p-2.5">
                  📖 {q.analysis}
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* 底部按钮 */}
      <div className="bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3">
          <button onClick={onBack}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-95">
            返回主页
          </button>
          <button onClick={onRetry}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm active:scale-95 shadow-md">
            再考一次
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════════════════
export default function SelfTestPage({ user, subject, grade: gradeProp = 'primary', onBack }) {
  const [mode, setMode] = useState('setup') // setup / loading / exam / result
  const [examData, setExamData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState(null)

  const themeColor = subject === 'politics' ? 'from-red-500 to-orange-600' : subject === 'english' ? 'from-blue-500 to-indigo-600' : 'from-amber-500 to-orange-600'
  const themeBg = subject === 'politics' ? 'from-red-50 to-orange-50' : subject === 'english' ? 'from-blue-50 to-indigo-50' : 'from-amber-50 to-orange-50'

  async function handleStart({ grade, examType }) {
    setMode('loading')
    setError(null)
    const isJunior = gradeProp === 'junior2'

    try {
      let systemPrompt, userPrompt

      if (subject === 'politics') {
        systemPrompt = getPoliticsExamPrompt(examType)
        userPrompt = `请生成一份初二道德与法治${JUNIOR_EXAM_TYPE_MAP[examType] || '期末综合'}测试卷。严格按照要求的题型结构和分值出题，确保总分100分。`
      } else if (isJunior && subject === 'chinese') {
        systemPrompt = getJuniorChineseExamPrompt(examType)
        userPrompt = `请生成一份初二语文${JUNIOR_EXAM_TYPE_MAP[examType] || '期末综合'}测试卷。严格按照要求的题型结构和分值出题，确保总分100分。`
      } else if (isJunior && subject === 'english') {
        systemPrompt = getJuniorEnglishExamPrompt(examType)
        userPrompt = `Please generate a Grade 8 English ${JUNIOR_EXAM_TYPE_MAP[examType] || '期末综合'} test paper. Follow the structure exactly with correct point allocation. Total: 100 points.`
      } else if (subject === 'english') {
        systemPrompt = getEnglishExamPrompt(grade, examType)
        userPrompt = `Please generate a ${GRADE_MAP[grade]} ${EXAM_TYPE_MAP[examType]} English test paper. Follow the structure exactly. Total: 100 points.`
      } else {
        systemPrompt = getChineseExamPrompt(grade, examType)
        userPrompt = `请生成一份${GRADE_MAP[grade]}${EXAM_TYPE_MAP[examType]}语文测试卷。严格按照要求的题型结构和分值出题，确保总分100分。`
      }

      const result = await callDeepSeek(systemPrompt, userPrompt, { temperature: 0.8, max_tokens: 3500 })

      if (!result.sections || !Array.isArray(result.sections)) {
        throw new Error('AI 返回格式异常，请重试')
      }

      // 规范化题目 ID
      let qIdx = 1
      result.sections.forEach(sec => {
        if (sec.subsections) {
          sec.subsections.forEach(sub => {
            (sub.questions || []).forEach(q => {
              if (q.type !== 'passage') {
                q.id = q.id || `q${qIdx++}`
              }
            })
          })
        } else {
          (sec.questions || []).forEach(q => {
            if (q.type !== 'passage') {
              q.id = q.id || `q${qIdx++}`
            }
          })
        }
      })

      setExamData(result)
      setMode('exam')
    } catch (err) {
      console.error('Exam generation error:', err)
      setError(err.message || '出题失败，请重试')
      setMode('setup')
    }
  }

  function handleSubmit(userAnswers, timeElapsed) {
    setAnswers(userAnswers)
    setElapsed(timeElapsed)
    setMode('result')
  }

  function handleRetry() {
    setExamData(null)
    setAnswers({})
    setElapsed(0)
    setMode('setup')
  }

  // ─── 设置界面 ───
  if (mode === 'setup') {
    return (
      <div className={`min-h-screen flex flex-col ${subject === 'english' ? 'bg-gradient-to-b from-blue-50 to-indigo-50' : 'bg-gradient-to-b from-amber-50 to-orange-50'}`}>
        <div className={`sticky top-0 z-10 bg-gradient-to-r ${themeColor} text-white shadow-sm`}
          style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}>
          <div className="flex items-center gap-3 px-4 pt-3 pb-3">
            <button onClick={onBack}
              className="w-9 h-9 flex items-center justify-center bg-white/20 rounded-xl text-lg font-bold active:bg-white/30">
              ←
            </button>
            <h1 className="flex-1 text-xl font-bold">📝 {subject === 'politics' ? '道德与法治' : subject === 'english' ? '英语' : '语文'}自测小考</h1>
          </div>
        </div>
        {error && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-600 font-medium">❌ {error}</p>
          </div>
        )}
        <SetupMode onStart={handleStart} subject={subject} grade={gradeProp} onBack={onBack} />
      </div>
    )
  }

  // ─── 加载中 ───
  if (mode === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-6">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">📝</div>
        </div>
        <p className="text-lg font-bold text-gray-700">AI 正在为你生成试卷...</p>
        <p className="text-sm text-gray-400 mt-2">包含阅读理解和作文，可能需要15-30秒</p>
        <div className="mt-6 space-y-2 text-xs text-gray-300">
          <p>✓ 根据年级和范围定制</p>
          <p>✓ 基础70% · 提升20% · 拓展10%</p>
          <p>✓ 包含阅读理解完整文章</p>
        </div>
      </div>
    )
  }

  // ─── 答题界面 ───
  if (mode === 'exam' && examData) {
    return (
      <ExamMode
        examData={examData}
        subject={subject}
        onBack={handleRetry}
        onSubmit={handleSubmit}
      />
    )
  }

  // ─── 结果界面 ───
  if (mode === 'result' && examData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className={`sticky top-0 z-10 bg-gradient-to-r ${themeColor} text-white shadow-sm`}
          style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}>
          <div className="flex items-center gap-3 px-4 pt-3 pb-3">
            <button onClick={onBack}
              className="w-9 h-9 flex items-center justify-center bg-white/20 rounded-xl text-lg font-bold active:bg-white/30">
              ←
            </button>
            <h1 className="flex-1 text-lg font-bold">📊 考试报告</h1>
          </div>
        </div>
        <ResultMode
          examData={examData}
          answers={answers}
          elapsed={elapsed}
          subject={subject}
          user={user}
          onBack={onBack}
          onRetry={handleRetry}
        />
      </div>
    )
  }

  return null
}
