import { KNOWLEDGE_DEPS } from '../data/knowledge_graph'

/**
 * 知识根因链可视化组件
 * 竖向步骤图：根节点 → ... → 当前弱项 → 建议
 */
export default function RootCauseChain({ chain, rootCause, suggestion, errorType }) {
  if (!chain || chain.length === 0) return null

  const typeColors = {
    concept: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', line: 'bg-red-300' },
    memory: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', line: 'bg-amber-300' },
    careless: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', line: 'bg-gray-300' },
  }
  const c = typeColors[errorType] || typeColors.concept

  return (
    <div className="flex flex-col">
      {chain.map((tag, i) => {
        const isRoot = i === 0
        const isLast = i === chain.length - 1
        const deps = KNOWLEDGE_DEPS[tag]
        const isLeaf = isLast && chain.length > 1

        return (
          <div key={i} className="flex items-stretch">
            {/* 左侧竖线 + 圆点 */}
            <div className="flex flex-col items-center w-8 flex-shrink-0">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                isRoot ? 'bg-indigo-500 ring-2 ring-indigo-200' :
                isLast ? 'bg-red-400 ring-2 ring-red-200' :
                'bg-gray-400'
              }`} />
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[20px] ${c.line}`} />
              )}
            </div>

            {/* 右侧内容 */}
            <div className={`flex-1 pb-3 ${isLast ? '' : ''}`}>
              <div className={`${isRoot ? 'bg-indigo-50 border-indigo-200' : isLast ? `${c.bg} ${c.border}` : 'bg-gray-50 border-gray-200'} border rounded-xl px-3 py-2`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isRoot ? 'text-indigo-500' : isLast ? c.text : 'text-gray-500'}`}>
                    {isRoot ? '根因' : isLast ? '弱项' : `第${i + 1}层`}
                  </span>
                  <span className={`text-sm font-medium ${isLast ? c.text : 'text-gray-800'}`}>
                    {tag}
                  </span>
                </div>
                {deps?.suggests && isRoot && (
                  <p className="text-xs text-gray-500 mt-1">{deps.suggests}</p>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* 建议 */}
      {suggestion && (
        <div className="flex items-stretch">
          <div className="flex flex-col items-center w-8 flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
          </div>
          <div className="flex-1 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <span className="text-xs font-bold text-green-600">建议</span>
            <p className="text-xs text-green-800 mt-0.5">{suggestion}</p>
          </div>
        </div>
      )}
    </div>
  )
}
