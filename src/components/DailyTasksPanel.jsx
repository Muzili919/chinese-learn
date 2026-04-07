import React from 'react'
import { DAILY_TASK_TEMPLATES, claimTaskReward, STAT_CONFIG } from '../utils/gamification'

/**
 * DailyTasksPanel - 每日任务面板
 * 显示4种每日任务的进度和领取按钮
 */
export default function DailyTasksPanel({ state, onClaim, onUpdate }) {
  const tasks = state?.dailyTasks || []
  const taskCounters = state?.taskCounters || {}
  
  // 如果没有任务（首次或已重置），显示初始化状态
  if (!tasks || tasks.length === 0) {
    return (
      <div style={{
        background: 'white', borderRadius: 16, padding: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>今日任务加载中...</p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>刷新页面即可查看</p>
      </div>
    )
  }

  // 计算完成数量
  const completedCount = tasks.filter(t => t.completed).length
  const claimedCount = tasks.filter(t => t.claimed).length

  return (
    <div>
      {/* 任务头部 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>
            📋 每日任务
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
            已完成 {completedCount}/{tasks.length} · 已领取 {claimedCount}
          </p>
        </div>
        {/* 重置倒计时提示 */}
        <div style={{
          background: '#fef3c7', color: '#92400e',
          fontSize: 10, padding: '4px 8px', borderRadius: 8,
          fontWeight: 500,
        }}>
          🕐 每日重置
        </div>
      </div>

      {/* 任务列表 */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {tasks.map(task => {
          const progress = Math.min(task.progress || 0, task.target)
          const pct = (progress / task.target) * 100
          const isCompleted = task.completed
          const isClaimed = task.claimed

          return (
            <div key={task.id} style={{
              background: isClaimed ? '#f9fafb' : 'white',
              borderRadius: 14, padding: '14px',
              border: isCompleted && !isClaimed
                ? '2px solid #34d399'
                : '1px solid #f3f4f6',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* 完成发光效果 */}
              {isCompleted && !isClaimed && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg, transparent, #34d399, transparent)',
                  animation: 'shimmer 2s ease-in-out infinite',
                }} />
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* 图标 */}
                <div style={{
                  fontSize: 28, width: 44, height: 44,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isClaimed ? '#f3f4f6' : `${STAT_CONFIG.intimacy.bgColor}`,
                  borderRadius: 12,
                  flexShrink: 0,
                  opacity: isClaimed ? 0.5 : 1,
                }}>
                  {task.icon}
                </div>

                {/* 信息 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: isClaimed ? '#9ca3af' : '#374151',
                    }}>
                      {task.title}
                    </span>
                    {isClaimed && <span style={{ fontSize: 10, color: '#34d399' }}>✅</span>}
                  </div>
                  
                  <p style={{
                    margin: '2px 0 6px', fontSize: 11, color: '#9ca3af',
                  }}>{task.desc}</p>

                  {/* 进度条 */}
                  <div style={{
                    width: '100%', background: '#f3f4f6', borderRadius: 5,
                    height: 7, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: isCompleted
                        ? 'linear-gradient(90deg, #34d399, #10b981)'
                        : 'linear-gradient(90deg, #6366f1, #a78bfa)',
                      borderRadius: 5, transition: 'width 0.4s ease',
                    }} />
                  </div>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginTop: 4,
                  }}>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>
                      {progress} / {task.target}
                    </span>
                    <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>
                      +{task.reward.exp || 0}exp
                      {task.reward.item ? ` ${task.icon}` : ''}
                    </span>
                  </div>
                </div>

                {/* 领取按钮 */}
                {!isCompleted && (
                  <button style={{
                    padding: '6px 12px', borderRadius: 8,
                    border: 'none', background: '#f3f4f6',
                    color: '#9ca3af', fontSize: 11, cursor: 'default',
                  }} disabled>进行中</button>
                )}
                {isCompleted && !isClaimed && (
                  <button
                    onClick={() => onClaim?.(task.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 8,
                      border: 'none', background: 'linear-gradient(135deg, #34d399, #10b981)',
                      color: 'white', fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                      animation: 'pulseBtn 2s infinite',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    领取
                  </button>
                )}
                {isClaimed && (
                  <span style={{
                    fontSize: 18, alignSelf: 'center',
                  }}>✅</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 提示文字 */}
      <p style={{
        margin: '12px 0 0', fontSize: 11, color: '#9ca3af', textAlign: 'center',
      }}>
        💡 完成答题、喂养、互动都可以推进任务进度
      </p>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulseBtn {
          0%, 100% { box-shadow: 0 2px 8px rgba(16,185,129,0.3); }
          50% { box-shadow: 0 2px 16px rgba(16,185,129,0.5); }
        }
      `}</style>
    </div>
  )
}
