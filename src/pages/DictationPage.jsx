import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { storage } from '../utils/storage'
import { syncAfterSession } from '../utils/sync'
import { speakEnglish, speakChinese, stop, initTTS } from '../utils/tts'
import enWords from '../data/dictation_en_words.json'
import cnWords from '../data/dictation_cn_words.json'

// ═══════════════════════════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════════════════════════
const STORAGE_KEY = 'cl_dictation_mastery'
const XP_CORRECT = 5
const XP_DICTATION = 10

// ═══════════════════════════════════════════════════════════════
// 掌握状态管理
// ═══════════════════════════════════════════════════════════════
function getMastery() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function saveMastery(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
function getWordStatus(wordId) {
  const m = getMastery()
  return m[wordId] || { status: 'new', correctCount: 0, wrongCount: 0, lastPractice: null }
}
function updateWordStatus(wordId, correct) {
  const m = getMastery()
  const prev = m[wordId] || { status: 'new', correctCount: 0, wrongCount: 0, lastPractice: null }
  prev.correctCount = (prev.correctCount || 0) + (correct ? 1 : 0)
  prev.wrongCount = (prev.wrongCount || 0) + (correct ? 0 : 1)
  prev.lastPractice = new Date().toISOString().slice(0, 10)
  // 连续3次正确且无错误 = 已掌握
  if (prev.correctCount >= 3 && prev.wrongCount === 0) prev.status = 'mastered'
  // 有错误记录 = 需加强（优先级高于普通学习中）
  else if (prev.wrongCount > 0) prev.status = 'weak'
  else if (prev.correctCount > 0 || prev.wrongCount > 0) prev.status = 'learning'
  m[wordId] = prev
  saveMastery(m)
}
function markAsUnmastered(wordId) {
  const m = getMastery()
  if (m[wordId]) { m[wordId].status = 'learning'; m[wordId].correctCount = 0 }
  saveMastery(m)
}

// ═══════════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════════
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickWords(subject, grade, semester, count) {
  const pool = subject === 'english' ? enWords : cnWords
  let filtered = pool.filter(w => w.grade === grade)
  if (semester && semester !== 'all') filtered = filtered.filter(w => w.semester === semester)
  // 优先级：需加强 > 未学 > 学习中 > 已掌握
  filtered.sort((a, b) => {
    const sa = getWordStatus(a.id).status
    const sb = getWordStatus(b.id).status
    const order = { weak: 0, new: 1, learning: 2, mastered: 3 }
    return (order[sa] ?? 1) - (order[sb] ?? 1)
  })
  return shuffle(filtered).slice(0, count)
}

// ═══════════════════════════════════════════════════════════════
// 设置模式
// ═══════════════════════════════════════════════════════════════
function SetupMode({ onStart, subject }) {
  const [grade, setGrade] = useState(4)
  const [semester, setSemester] = useState('all')
  const [count, setCount] = useState(20)
  const [speed, setSpeed] = useState(0.75)

  const semesters = useMemo(() => {
    const pool = subject === 'english' ? enWords : cnWords
    return [...new Set(pool.filter(w => w.grade === grade).map(w => w.semester))]
  }, [subject, grade])

  const totalWords = useMemo(() => {
    const pool = subject === 'english' ? enWords : cnWords
    let f = pool.filter(w => w.grade === grade)
    if (semester !== 'all') f = f.filter(w => w.semester === semester)
    return f.length
  }, [subject, grade, semester])

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      {/* 年级 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-2">选择年级</div>
        <div className="flex gap-2">
          {[4, 5, 6].map(g => (
            <button key={g} onClick={() => { setGrade(g); setSemester('all') }}
              className={`flex-1 py-3 rounded-2xl font-bold text-base transition-all active:scale-95 ${grade === g ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>
              {g}年级
            </button>
          ))}
        </div>
      </div>

      {/* 学期 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-2">选择学期（可选）</div>
        <div className="flex gap-2">
          <button onClick={() => setSemester('all')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${semester === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            全部
          </button>
          {semesters.map(s => (
            <button key={s} onClick={() => setSemester(s)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${semester === s ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 数量 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-2">听写数量</div>
        <div className="flex gap-2">
          {[10, 15, 20, 30].map(n => (
            <button key={n} onClick={() => setCount(n)}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${count === n ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>
              {n}个
            </button>
          ))}
        </div>
      </div>

      {/* 语速 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-2">朗读速度</div>
        <div className="flex gap-2">
          {[
            { val: 0.5, label: '慢速', desc: '听写推荐' },
            { val: 0.75, label: '正常', desc: '标准速度' },
            { val: 1.0, label: '快速', desc: '挑战模式' },
          ].map(s => (
            <button key={s.val} onClick={() => setSpeed(s.val)}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${speed === s.val ? 'bg-gradient-to-r from-teal-400 to-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>
              {s.label}
              <div className="text-[10px] font-normal opacity-70 mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 词库统计 */}
      <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">词库中共有 <span className="font-bold text-indigo-600">{totalWords}</span> 个词</span>
        <span className="text-xs text-gray-400">将抽取 {Math.min(count, totalWords)} 个</span>
      </div>

      {/* 开始 */}
      <button onClick={() => onStart({ subject, grade, semester, count, speed })}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform">
        开始听写 →
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 听写模式
// ═══════════════════════════════════════════════════════════════
function DictatingMode({ words, speed, subject, onFinish }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [repeatCount, setRepeatCount] = useState(0)
  const timerRef = useRef(null)

  const word = words[index]
  const isLast = index >= words.length - 1
  const progress = ((index + 1) / words.length) * 100

  useEffect(() => {
    return () => { stop(); clearTimeout(timerRef.current) }
  }, [])

  function handlePlay() {
    if (playing) return
    setPlaying(true)
    setShowAnswer(false)
    setRepeatCount(0)
    const fn = subject === 'english'
      ? () => speakEnglish(word.word, { rate: speed, onEnd: () => { setPlaying(false); setRepeatCount(1) } })
      : () => speakChinese(word.word, { rate: speed, onEnd: () => { setPlaying(false); setRepeatCount(1) } })
    fn()
  }

  function handleRepeat() {
    if (playing) return
    setPlaying(true)
    const fn = subject === 'english'
      ? () => speakEnglish(word.word, { rate: speed, onEnd: () => { setPlaying(false); setRepeatCount(r => r + 1) } })
      : () => speakChinese(word.word, { rate: speed, onEnd: () => { setPlaying(false); setRepeatCount(r => r + 1) } })
    fn()
  }

  function handleNext() {
    stop()
    if (isLast) {
      onFinish()
    } else {
      setIndex(i => i + 1)
      setShowAnswer(false)
      setRepeatCount(0)
      // 自动播放
      if (autoPlay) {
        timerRef.current = setTimeout(() => {
          const nextWord = words[index + 1]
          setPlaying(true)
          const fn = subject === 'english'
            ? () => speakEnglish(nextWord.word, { rate: speed, onEnd: () => setPlaying(false) })
            : () => speakChinese(nextWord.word, { rate: speed, onEnd: () => setPlaying(false) })
          fn()
        }, 1500)
      }
    }
  }

  return (
    <div className="flex flex-col items-center px-4 py-6 gap-6 min-h-screen">
      {/* 进度 */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-medium">
            {subject === 'english' ? '英语' : '语文'}听写
          </span>
          <span className="text-xs font-bold text-indigo-600">{index + 1} / {words.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* 当前词序号 */}
      <div className="text-6xl font-extrabold text-gray-200">
        #{index + 1}
      </div>

      {/* 播放按钮 */}
      <button onClick={handlePlay} disabled={playing}
        className={`w-32 h-32 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 ${playing ? 'bg-gray-200' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
        <span className="text-5xl">{playing ? '🔊' : '▶️'}</span>
      </button>

      <div className="text-sm text-gray-400">
        {playing ? '正在朗读...' : '点击播放'}
      </div>

      {/* 重播 + 显示答案 */}
      <div className="flex gap-3 w-full">
        <button onClick={handleRepeat} disabled={playing}
          className="flex-1 py-3 rounded-2xl border-2 border-gray-200 bg-white font-bold text-sm text-gray-600 active:scale-95 transition-all disabled:opacity-40">
          🔁 重播 ({repeatCount})
        </button>
        <button onClick={() => setShowAnswer(v => !v)}
          className={`flex-1 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all ${showAnswer ? 'bg-amber-50 border-2 border-amber-300 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
          👁 {showAnswer ? '隐藏' : '显示答案'}
        </button>
      </div>

      {/* 答案（家长参考） */}
      {showAnswer && (
        <div className="w-full bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 text-center"
          style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="text-3xl font-extrabold text-gray-800 mb-1">{word.word}</div>
          {subject === 'english' && word.phonetic && (
            <div className="text-sm text-gray-400 mb-1">/{word.phonetic}/</div>
          )}
          {subject === 'english' && word.meaning && (
            <div className="text-base text-amber-700">{word.meaning}</div>
          )}
          {subject === 'chinese' && word.pinyin && (
            <div className="text-sm text-amber-600">{word.pinyin}</div>
          )}
          {word.example && (
            <div className="text-xs text-gray-400 mt-2 italic bg-white/70 rounded-xl px-3 py-2 leading-relaxed">
              「{word.example}」
            </div>
          )}
        </div>
      )}

      {/* 自动播放开关 */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">自动播放下一个</span>
        <button onClick={() => setAutoPlay(v => !v)}
          className={`w-12 h-6 rounded-full transition-all relative ${autoPlay ? 'bg-indigo-500' : 'bg-gray-300'}`}>
          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${autoPlay ? 'left-6.5' : 'left-0.5'}`} />
        </button>
      </div>

      {/* 下一个 */}
      <button onClick={handleNext}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform">
        {isLast ? '完成听写 ✓' : '下一个 →'}
      </button>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 打分模式（拍照AI打分 / 手动打分）
// ═══════════════════════════════════════════════════════════════
function GradingMode({ words, subject, onResult }) {
  const [mode, setMode] = useState(null) // 'photo' | 'manual' | null
  const [manualResults, setManualResults] = useState({})
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const fileRef = useRef(null)

  // 手动打分
  function toggleWord(wordId) {
    setManualResults(prev => {
      const next = { ...prev }
      if (next[wordId] === undefined) next[wordId] = false // 默认打错
      else if (next[wordId] === false) next[wordId] = true // 改为对
      else delete next[wordId] // 取消标记
      return next
    })
  }

  function handleManualSubmit() {
    // 未标记的默认为正确
    const results = words.map(w => ({
      ...w,
      correct: manualResults[w.id] !== false,
    }))
    onResult(results)
  }

  // 拍照AI打分
  async function handlePhotoUpload(file) {
    setPhotoUploading(true)
    setPhotoError('')
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1]
        const wordList = words.map(w => subject === 'english' ? `${w.word}(${w.meaning})` : `${w.word}(${w.pinyin})`).join('、')
        const prompt = `这是一张学生听写作业的照片。请对照以下词语列表，逐一识别学生写的每个词，判断对错。

词语列表：${wordList}

请严格按以下JSON格式返回（不要加其他文字）：
{"results":[{"word":"词语","correct":true/false}]}`
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'user', content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
              ]},
            ],
            temperature: 0.1,
            max_tokens: 2000,
          }),
        })
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content || ''
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('AI返回格式异常')
        const parsed = JSON.parse(jsonMatch[0])
        const aiResults = (parsed.results || []).map(r => {
          const original = words.find(w => w.word === r.word || w.word.includes(r.word) || r.word.includes(w.word))
          return {
            ...original,
            correct: !!r.correct,
          }
        })
        // 补充AI未识别的词（默认正确）
        const finalResults = words.map(w => {
          const ai = aiResults.find(r => r && r.id === w.id)
          return ai || { ...w, correct: true }
        })
        onResult(finalResults)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error(err)
      setPhotoError('识别失败，请尝试手动打分：' + (err.message || '未知错误'))
      setPhotoUploading(false)
    }
  }

  if (!mode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-6">
        <div className="text-6xl">📝</div>
        <h2 className="text-xl font-bold text-gray-800">听写完成！</h2>
        <p className="text-sm text-gray-500 text-center">请选择打分方式来批改听写结果</p>

        <div className="w-full flex flex-col gap-3 mt-4">
          <button onClick={() => setMode('photo')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-base shadow-md active:scale-95 transition-transform flex items-center justify-center gap-3">
            <span className="text-2xl">📷</span>
            拍照上传 AI 打分
          </button>
          <button onClick={() => setMode('manual')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-600 text-white font-bold text-base shadow-md active:scale-95 transition-transform flex items-center justify-center gap-3">
            <span className="text-2xl">✋</span>
            手动打分
          </button>
        </div>

        <p className="text-[10px] text-gray-400 mt-2">提示：拍照上传需要网络连接，AI会自动识别手写内容</p>
      </div>
    )
  }

  // 拍照模式
  if (mode === 'photo') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-6">
        {photoUploading ? (
          <>
            <div className="text-6xl animate-bounce">📷</div>
            <h2 className="text-lg font-bold text-gray-700">AI 正在识别中...</h2>
            <p className="text-sm text-gray-400">请稍候，正在分析手写内容</p>
            <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 animate-pulse" style={{ width: '60%' }} />
            </div>
          </>
        ) : (
          <>
            <div className="text-6xl">📷</div>
            <h2 className="text-lg font-bold text-gray-800">拍照上传听写作业</h2>
            <p className="text-sm text-gray-500 text-center">请拍摄学生写在纸上的听写内容</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => { if (e.target.files[0]) handlePhotoUpload(e.target.files[0]) }} />
            <button onClick={() => fileRef.current?.click()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-base shadow-md active:scale-95 transition-transform">
              拍照 / 选择图片
            </button>
            {photoError && (
              <div className="w-full bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                <p className="text-sm text-red-600">{photoError}</p>
                <button onClick={() => setMode('manual')} className="text-sm text-indigo-600 font-medium mt-1">
                  改用手动打分 →
                </button>
              </div>
            )}
            <button onClick={() => setMode(null)}
              className="text-sm text-gray-400">返回选择</button>
          </>
        )}
      </div>
    )
  }

  // 手动打分模式
  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">手动打分</h2>
        <span className="text-xs text-gray-400">点击标记对/错</span>
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 rounded-xl px-3 py-2">
        💡 未标记的词语默认为正确。点击一次标记为❌，再点改为✅，三点取消。
      </div>

      <div className="flex flex-col gap-2">
        {words.map((w, i) => {
          const status = manualResults[w.id]
          let bg = 'bg-white border-gray-200'
          let icon = ''
          if (status === true) { bg = 'bg-green-50 border-green-300'; icon = '✅' }
          else if (status === false) { bg = 'bg-red-50 border-red-300'; icon = '❌' }
          return (
            <button key={w.id} onClick={() => toggleWord(w.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all active:scale-98 ${bg}`}>
              <span className="text-xs text-gray-400 w-6">{i + 1}</span>
              <span className="text-lg font-bold text-gray-800 flex-1">{w.word}</span>
              {subject === 'english' && w.meaning && (
                <span className="text-xs text-gray-400">{w.meaning}</span>
              )}
              {subject === 'chinese' && w.pinyin && (
                <span className="text-xs text-gray-400">{w.pinyin}</span>
              )}
              <span className="text-lg">{icon || '⬜'}</span>
            </button>
          )
        })}
      </div>

      <button onClick={handleManualSubmit}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform mt-2">
        提交打分结果 →
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 结果模式
// ═══════════════════════════════════════════════════════════════
function ResultMode({ results, subject, onDone }) {
  const [unmastered, setUnmastered] = useState(new Set())
  const correct = results.filter(r => r.correct).length
  const total = results.length
  const pct = Math.round((correct / total) * 100)

  // 保存掌握状态
  useEffect(() => {
    results.forEach(r => updateWordStatus(r.id, r.correct))
  }, [results])

  function toggleUnmastered(id) {
    setUnmastered(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else { next.add(id); markAsUnmastered(id) }
      return next
    })
  }

  function handleDone() {
    // 加 XP
    storage.addXP(null, XP_DICTATION)
    // 云端同步（跨设备学习数据同步）
    if (user?.id) syncAfterSession(user.id)
    onDone()
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      {/* 得分 */}
      <div className={`rounded-3xl p-6 text-center ${pct >= 80 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' : pct >= 60 ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200' : 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200'}`}>
        <div className="text-5xl mb-2">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
        <div className={`text-4xl font-extrabold ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
          {pct}%
        </div>
        <div className="text-sm text-gray-500 mt-1">{correct} / {total} 正确</div>
      </div>

      {/* 词语列表 */}
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-2">点击标记"未掌握"的词语（会加入复习池）</div>
        <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
          {results.map((r, i) => (
            <div key={r.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${r.correct ? 'bg-white border-gray-100' : 'bg-red-50 border-red-200'}`}>
              <span className={`text-lg font-bold ${r.correct ? 'text-green-500' : 'text-red-500'}`}>
                {r.correct ? '✅' : '❌'}
              </span>
              <span className="text-xs text-gray-400 w-5">{i + 1}</span>
              <span className="font-bold text-gray-800 flex-1">{r.word}</span>
              {subject === 'english' && <span className="text-xs text-gray-400">{r.meaning}</span>}
              {subject === 'chinese' && <span className="text-xs text-gray-400">{r.pinyin}</span>}
              {!r.correct && (
                <button onClick={() => toggleUnmastered(r.id)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${unmastered.has(r.id) ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                  {unmastered.has(r.id) ? '未掌握 ✓' : '标记未掌握'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 错词统计 */}
      {unmastered.size > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
          <div className="text-sm font-semibold text-orange-700">
            已标记 {unmastered.size} 个未掌握词语，下次听写会优先出现
          </div>
        </div>
      )}

      <button onClick={handleDone}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform">
        完成 +{XP_DICTATION} XP →
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 词库浏览模式
// ═══════════════════════════════════════════════════════════════
function WordBankMode({ subject, setSubject }) {
  const [grade, setGrade] = useState(4)
  const [filter, setFilter] = useState('all') // all / new / learning / mastered

  const pool = subject === 'english' ? enWords : cnWords
  const filtered = useMemo(() => {
    let words = pool.filter(w => w.grade === grade)
    if (filter !== 'all') {
      words = words.filter(w => getWordStatus(w.id).status === filter)
    }
    return words
  }, [pool, grade, filter])

  const stats = useMemo(() => {
    const words = pool.filter(w => w.grade === grade)
    return {
      total: words.length,
      new: words.filter(w => getWordStatus(w.id).status === 'new').length,
      learning: words.filter(w => getWordStatus(w.id).status === 'learning').length,
      weak: words.filter(w => getWordStatus(w.id).status === 'weak').length,
      mastered: words.filter(w => getWordStatus(w.id).status === 'mastered').length,
    }
  }, [pool, grade])

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(w => {
      const s = w.semester || '全部'
      if (!map[s]) map[s] = []
      map[s].push(w)
    })
    return Object.entries(map)
  }, [filtered])

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      {/* 科目切换 */}
      <div className="flex gap-2">
        {[
          { key: 'english', label: '英语', emoji: '🔤' },
          { key: 'chinese', label: '语文', emoji: '📝' },
        ].map(s => (
          <button key={s.key} onClick={() => setSubject(s.key)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${subject === s.key ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* 年级 */}
      <div className="flex gap-2">
        {[4, 5, 6].map(g => (
          <button key={g} onClick={() => setGrade(g)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${grade === g ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {g}年级
          </button>
        ))}
      </div>

      {/* 统计 - 5列：全部 / 未学 / 学习中 / 需加强 / 已掌握 */}
      <div className="grid grid-cols-5 gap-1.5">
        {[
          { key: 'all', label: '全部', count: stats.total, color: 'bg-gray-50 text-gray-700' },
          { key: 'new', label: '未学', count: stats.new, color: 'bg-blue-50 text-blue-700' },
          { key: 'learning', label: '学习中', count: stats.learning, color: 'bg-amber-50 text-amber-700' },
          { key: 'weak', label: '需加强', count: stats.weak, color: 'bg-red-50 text-red-600', badge: stats.weak > 0 ? '🔴' : null },
          { key: 'mastered', label: '已掌握', count: stats.mastered, color: 'bg-green-50 text-green-700' },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`rounded-xl p-2 text-center transition-all active:scale-95 ${filter === s.key ? `${s.color} border-2 border-indigo-300 shadow-sm` : 'bg-white border border-gray-100'}`}>
            <div className="text-base font-extrabold leading-tight">{s.count}</div>
            <div className="text-[9px] font-medium mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      {/* 进度条 */}
      {stats.total > 0 && (
        <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">掌握进度</span>
            <span className="text-xs font-bold text-green-600">
              {stats.mastered}/{stats.total} 已掌握
              {stats.weak > 0 && <span className="text-red-500 ml-1">· {stats.weak}需加强</span>}
            </span>
          </div>
          <div className="flex gap-1 h-2.5 rounded-full overflow-hidden">
            {stats.new > 0 && <div className="bg-blue-300 rounded-l-full" style={{ width: `${(stats.new / stats.total) * 100}%` }} />}
            {stats.learning > 0 && <div className="bg-amber-400" style={{ width: `${(stats.learning / stats.total) * 100}%` }} />}
            {stats.weak > 0 && <div className="bg-red-400" style={{ width: `${(stats.weak / stats.total) * 100}%` }} />}
            {stats.mastered > 0 && <div className="bg-green-500 rounded-r-full" style={{ width: `${(stats.mastered / stats.total) * 100}%` }} />}
          </div>
          <div className="flex gap-4 text-[9px] text-gray-400">
            <span>🔵未学 {stats.new}</span>
            <span>🟡学中 {stats.learning}</span>
            <span>🔴加强 {stats.weak}</span>
            <span>🟢掌握 {stats.mastered}</span>
          </div>
        </div>
      )}

      {/* 词语列表 */}
      <div className="flex flex-col gap-3 max-h-[38vh] overflow-y-auto pb-4">
        {grouped.map(([semester, words]) => (
          <div key={semester}>
            <div className="text-xs font-semibold text-gray-400 mb-1.5">{semester}（{words.length}词）</div>
            <div className="flex flex-wrap gap-1.5">
              {words.map(w => {
                const st = getWordStatus(w.id)
                const bg = st.status === 'mastered' ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                  : st.status === 'weak' ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                  : st.status === 'learning' ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
                const badge = st.status === 'weak' ? '!' : st.status === 'mastered' ? '✓' : ''
                return (
                  <span key={w.id} title={w.pinyin || w.meaning || ''} className={`relative text-xs px-2.5 py-1 rounded-full font-medium ${bg}`}>
                    {w.word}{badge && <sup className="text-[9px] ml-0.5">{badge}</sup>}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="text-center text-gray-400 py-8 text-sm">
            {filter === 'weak' ? '🎉 没有需要加强的词，继续保持！' : '暂无词语'}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════════════════════════
export default function DictationPage({ user, subject: subjectProp, onBack }) {
  const [mode, setMode] = useState('setup') // setup / dictating / grading / result / wordbank
  // subject 支持本地切换（词库浏览时可切换语文/英语）
  const [subject, setSubject] = useState(subjectProp || 'chinese')
  const [sessionConfig, setSessionConfig] = useState(null)
  const [sessionWords, setSessionWords] = useState([])
  const [gradingResults, setGradingResults] = useState(null)

  useEffect(() => { initTTS() }, [])

  function handleStart(config) {
    const words = pickWords(config.subject, config.grade, config.semester, config.count)
    if (words.length === 0) return
    setSessionConfig(config)
    setSessionWords(words)
    setMode('dictating')
  }

  function handleDictationFinish() {
    setMode('grading')
  }

  function handleGradingResult(results) {
    setGradingResults(results)
    setMode('result')
  }

  function handleDone() {
    setMode('setup')
    setSessionConfig(null)
    setSessionWords([])
    setGradingResults(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-purple-50">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 36px)' }}>
        <div className="flex items-center gap-3 px-4 pt-3 pb-3">
          <button onClick={onBack}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl text-lg font-bold text-gray-500 active:bg-gray-200 transition-colors">
            ←
          </button>
          <h1 className="flex-1 text-xl font-bold text-gray-800">听写星球 ✍️</h1>
          {mode === 'setup' && (
            <button onClick={() => setMode('wordbank')}
              className="text-xs px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold active:scale-95 transition-all">
              📖 词库
            </button>
          )}
          {mode === 'wordbank' && (
            <button onClick={() => setMode('setup')}
              className="text-xs px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 font-bold active:scale-95 transition-all">
              ← 返回
            </button>
          )}
        </div>

        {/* Tab 指示 */}
        <div className="flex border-t border-gray-100">
          {[
            { key: 'setup', label: '✍️ 听写' },
            { key: 'wordbank', label: '📖 词库' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setMode(tab.key)}
              className={`flex-1 text-sm py-2 font-semibold transition-colors ${mode === tab.key ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-400'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'setup' && (
          <SetupMode onStart={handleStart} subject={subject} />
        )}
        {mode === 'dictating' && sessionConfig && (
          <DictatingMode words={sessionWords} speed={sessionConfig.speed} subject={subject} onFinish={handleDictationFinish} />
        )}
        {mode === 'grading' && (
          <GradingMode words={sessionWords} subject={subject} onResult={handleGradingResult} />
        )}
        {mode === 'result' && gradingResults && (
          <ResultMode results={gradingResults} subject={subject} onDone={handleDone} />
        )}
        {mode === 'wordbank' && (
          <WordBankMode subject={subject} setSubject={setSubject} />
        )}
      </div>
    </div>
  )
}
