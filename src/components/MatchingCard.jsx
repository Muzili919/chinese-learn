import React, { useState, useEffect } from 'react';

export default function MatchingCard({ 
  pairs, 
  onAnswer, 
  currentQuestion, 
  totalQuestions 
}) {
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matches, setMatches] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 打乱右侧顺序
  const [shuffledRight, setShuffledRight] = useState([]);
  
  useEffect(() => {
    if (pairs && pairs.length > 0) {
      const rightItems = pairs.map((p, index) => ({ ...p, originalIndex: index }));
      setShuffledRight([...rightItems].sort(() => Math.random() - 0.5));
    }
  }, [pairs]);

  const handleLeftClick = (index) => {
    if (isSubmitting) return;
    setSelectedLeft(index);
    
    // 如果已经选了右边，完成配对
    if (selectedRight !== null) {
      completeMatch(index, selectedRight);
    }
  };

  const handleRightClick = (index) => {
    if (isSubmitting) return;
    setSelectedRight(index);
    
    // 如果已经选了左边，完成配对
    if (selectedLeft !== null) {
      completeMatch(selectedLeft, index);
    }
  };

  const completeMatch = (leftIndex, rightIndex) => {
    const newMatch = {
      left: pairs[leftIndex],
      right: shuffledRight[rightIndex],
      leftIndex,
      rightIndex
    };
    
    setMatches([...matches, newMatch]);
    setSelectedLeft(null);
    setSelectedRight(null);
    
    // 检查是否完成所有配对
    if (matches.length + 1 === pairs.length) {
      setIsSubmitting(true);
      setTimeout(() => {
        // 计算得分
        const correctMatches = matches.filter(m => 
          m.left.answer === m.right.answer || m.left.id === m.right.id
        ).length;
        const score = Math.round((correctMatches / pairs.length) * 100);
        onAnswer({ matches, score });
      }, 500);
    }
  };

  const handleReset = () => {
    setMatches([]);
    setSelectedLeft(null);
    setSelectedRight(null);
    setIsSubmitting(false);
    // 重新打乱
    if (pairs && pairs.length > 0) {
      const rightItems = pairs.map((p, index) => ({ ...p, originalIndex: index }));
      setShuffledRight([...rightItems].sort(() => Math.random() - 0.5));
    }
  };

  // 检查某个项目是否已配对
  const isLeftMatched = (index) => matches.some(m => m.leftIndex === index);
  const isRightMatched = (index) => matches.some(m => m.rightIndex === index);

  if (!pairs || pairs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <p className="text-gray-600 text-center">暂无连线题数据</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-indigo-500">
      {/* 题目编号 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          第 {currentQuestion} 题 / 共 {totalQuestions} 题
        </span>
        <button
          onClick={handleReset}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          重置
        </button>
      </div>

      {/* 题目说明 */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">连线题</h3>
        <p className="text-gray-600 text-sm">点击左边的成语，再点击右边的解释，完成配对</p>
      </div>

      {/* 连线区域 */}
      <div className="flex gap-4">
        {/* 左侧 - 成语 */}
        <div className="flex-1 space-y-2">
          <h4 className="font-semibold text-gray-700 mb-3 text-center">成语</h4>
          {pairs.map((pair, index) => (
            <button
              key={`left-${index}`}
              onClick={() => handleLeftClick(index)}
              disabled={isLeftMatched(index) || isSubmitting}
              className={`w-full p-3 rounded-lg text-left font-medium transition-all ${
                isLeftMatched(index)
                  ? 'bg-green-100 text-green-800 cursor-not-allowed'
                  : selectedLeft === index
                  ? 'bg-blue-500 text-white transform scale-105'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              {pair.question || pair.left}
            </button>
          ))}
        </div>

        {/* 中间 - 连线指示 */}
        <div className="flex items-center justify-center">
          <div className="text-2xl text-gray-400">
            {selectedLeft !== null && selectedRight !== null ? '✓' : '↔'}
          </div>
        </div>

        {/* 右侧 - 解释 */}
        <div className="flex-1 space-y-2">
          <h4 className="font-semibold text-gray-700 mb-3 text-center">解释</h4>
          {shuffledRight.map((pair, index) => (
            <button
              key={`right-${index}`}
              onClick={() => handleRightClick(index)}
              disabled={isRightMatched(index) || isSubmitting}
              className={`w-full p-3 rounded-lg text-left font-medium transition-all ${
                isRightMatched(index)
                  ? 'bg-green-100 text-green-800 cursor-not-allowed'
                  : selectedRight === index
                  ? 'bg-green-500 text-white transform scale-105'
                  : 'bg-green-50 text-green-800 hover:bg-green-100'
              }`}
            >
              {pair.answer || pair.right}
            </button>
          ))}
        </div>
      </div>

      {/* 配对进度 */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>配对进度</span>
          <span>{matches.length} / {pairs.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(matches.length / pairs.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 已配对显示 */}
      {matches.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-2">已配对：</h4>
          <div className="space-y-1">
            {matches.map((match, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <span className="font-medium text-blue-600">{match.left.question || match.left.left}</span>
                <span className="mx-2">→</span>
                <span className="font-medium text-green-600">{match.right.answer || match.right.right}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
