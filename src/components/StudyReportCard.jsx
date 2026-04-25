import { useState } from 'react'

const EFFORT_STYLE = {
  '认真': { bg: '#f0fdf4', border: '#86efac', text: '#16a34a', icon: '✅' },
  '正常': { bg: '#eff6ff', border: '#93c5fd', text: '#2563eb', icon: '👍' },
  '需关注': { bg: '#fff7ed', border: '#fdba74', text: '#ea580c', icon: '⚠️' },
  '敷衍': { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', icon: '❌' },
}

function AccuracyBar({ accuracy }) {
  const color = accuracy >= 80 ? '#22c55e' : accuracy >= 60 ? '#3b82f6' : accuracy >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ width: 60, height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
      <div style={{ width: `${accuracy}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.3s' }} />
    </div>
  )
}

function formatTime(sec) {
  if (sec < 60) return `${sec}秒`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}分${s}秒` : `${m}分钟`
}

function GradeSection({ title, emoji, subjects }) {
  if (subjects.length === 0) return null

  const totalQ = subjects.reduce((s, [, d]) => s + d.totalQuestions, 0)
  const totalCorrect = subjects.reduce((s, [, d]) => s + d.totalCorrect, 0)
  const totalTime = subjects.reduce((s, [, d]) => s + d.totalTime, 0)
  const totalAcc = totalQ > 0 ? Math.round(totalCorrect / totalQ * 100) : 0

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e40af, #6d28d9)',
        borderRadius: 16, padding: '12px 16px', color: 'white', marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>{emoji}</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          <div><div style={{ fontSize: 20, fontWeight: 800 }}>{totalQ}</div><div style={{ opacity: 0.7 }}>总题数</div></div>
          <div><div style={{ fontSize: 20, fontWeight: 800 }}>{totalAcc}%</div><div style={{ opacity: 0.7 }}>正确率</div></div>
          <div><div style={{ fontSize: 20, fontWeight: 800 }}>{formatTime(totalTime)}</div><div style={{ opacity: 0.7 }}>耗时</div></div>
          <div><div style={{ fontSize: 20, fontWeight: 800 }}>{subjects.length}</div><div style={{ opacity: 0.7 }}>学科</div></div>
        </div>
      </div>
      {subjects.map(([key, data]) => (
        <SubjectCard key={key} data={data} />
      ))}
    </div>
  )
}

function SubjectCard({ data }) {
  const [expanded, setExpanded] = useState(null)
  const eff = EFFORT_STYLE[data.effort] || EFFORT_STYLE['正常']
  const planetKeys = Object.keys(data.planets)
  const doneCount = planetKeys.length
  const allCount = data.allPlanets?.length || doneCount

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      border: `1px solid #f3f4f6`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 6,
    }}>
      <div
        onClick={() => setExpanded(expanded ? null : true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', cursor: 'pointer', background: 'white',
        }}
      >
        <span style={{ fontSize: 20 }}>{data.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937' }}>{data.label}</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
            {data.totalQuestions}题 · 正确率{data.accuracy}% · {formatTime(data.totalTime)}
          </div>
        </div>
        <span style={{
          padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700,
          background: eff.bg, color: eff.text, border: `1px solid ${eff.border}`,
        }}>
          {eff.icon} {data.effort}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, color: doneCount >= allCount ? '#16a34a' : '#6b7280',
          background: doneCount >= allCount ? '#f0fdf4' : '#f9fafb',
          padding: '2px 8px', borderRadius: 6, border: `1px solid ${doneCount >= allCount ? '#bbf7d0' : '#e5e7eb'}`,
        }}>
          {doneCount}/{allCount} 星球
        </span>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid #f3f4f6' }}>
          {data.avgTime < 3 && (
            <div style={{
              margin: '6px 0', padding: '4px 10px', borderRadius: 8,
              background: '#fef3c7', border: '1px solid #fde68a',
              fontSize: 10, color: '#92400e', fontWeight: 600,
            }}>
              ⚡ 平均每题 {data.avgTime}s，做题过快
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {(data.allPlanets || []).map(planet => {
              const stats = data.planets[planet.tag]
              if (!stats) {
                return (
                  <div key={planet.tag} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 10px', borderRadius: 10,
                    background: '#f9fafb', opacity: 0.5,
                  }}>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>⬜</span>
                    <span style={{ flex: 1, fontSize: 12, color: '#9ca3af' }}>{planet.label}</span>
                    <span style={{ fontSize: 10, color: '#d1d5db' }}>未练习</span>
                  </div>
                )
              }
              const isFast = stats.avgTime < 3
              return (
                <div key={planet.tag} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', borderRadius: 10,
                  background: stats.accuracy >= 80 ? '#f0fdf4' : stats.accuracy >= 60 ? '#eff6ff' : '#fef2f2',
                }}>
                  <span style={{ fontSize: 12 }}>{stats.accuracy >= 80 ? '✅' : stats.accuracy >= 60 ? '🔵' : '❌'}</span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#1f2937' }}>{planet.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: stats.accuracy >= 80 ? '#16a34a' : stats.accuracy >= 60 ? '#2563eb' : '#dc2626' }}>
                    {stats.correct}/{stats.total}
                  </span>
                  <AccuracyBar accuracy={stats.accuracy} />
                  <span style={{ fontSize: 10, color: '#6b7280', minWidth: 32, textAlign: 'right' }}>
                    {stats.accuracy}%
                  </span>
                  <span style={{ fontSize: 9, color: isFast ? '#ef4444' : '#9ca3af', fontWeight: isFast ? 700 : 400 }}>
                    {stats.avgTime}s{isFast ? '⚡' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudyReportCard({ report }) {
  const subjects = Object.entries(report)
  if (subjects.length === 0) {
    return (
      <div style={{
        background: '#f9fafb', borderRadius: 16, padding: 20,
        border: '2px dashed #e5e7eb', textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
        <p style={{ color: '#6b7280', fontWeight: 600 }}>今天还没有学习记录</p>
        <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>开始答题后会在这里看到详细报告</p>
      </div>
    )
  }

  const primary = subjects.filter(([, d]) => d.grade === 'primary')
  const junior = subjects.filter(([, d]) => d.grade === 'junior')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <GradeSection title="小学" emoji="🎒" subjects={primary} />
      <GradeSection title="初中" emoji="🎓" subjects={junior} />
    </div>
  )
}
