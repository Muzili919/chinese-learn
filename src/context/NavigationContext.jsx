/**
 * NavigationContext — 全局导航上下文
 *
 * 解决"状态机路由 props 回调随页面数线性增长"问题。
 * 新增页面只需 useNavigation() 即可跳转，不需要父组件透传回调。
 *
 * 用法：
 *   const { navigate, back, setTab } = useNavigation()
 *   navigate('quiz', { tag: '字词', maxQuestions: 5 })
 *   navigate('report')
 *   back()
 *   setTab('pet')
 *
 * 支持的目的地（dest）：
 *   'home'               → 回到主页（等同 back()）
 *   'report'             → 数据报告页
 *   'quiz'               → 普通答题（需传 opts）
 *   'selfTest'           → 自测页
 *   'reading'            → 阅读理解
 *   'essay'              → 作文
 *   'dictation'          → 听写
 *   'lightningQuiz'      → 闪电测验
 *   'wrongAnswers'       → 错题复习
 *   'sentencePractice'   → 句子练习
 *   'englishQuiz'        → 英语答题
 *   'politicsQuiz'       → 道法答题
 *   'variantTraining'    → 变体训练
 */

import { createContext, useContext } from 'react'

export const NavigationContext = createContext(null)

/**
 * 在任意组件中获取导航函数
 * @returns {{ navigate, back, setTab, user, grade, activeSubject }}
 */
export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx) {
    // 优雅降级：未包裹在 Provider 内时返回空操作（防止测试/Story环境崩溃）
    console.warn('[useNavigation] NavigationContext not found, using noop')
    return {
      navigate: () => {},
      back:     () => {},
      setTab:   () => {},
      user:     null,
      grade:    'primary',
      activeSubject: 'chinese',
    }
  }
  return ctx
}
