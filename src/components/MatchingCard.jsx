import React, { useState, useEffect } from 'react';
import '../styles/mobile-optimizations.css';

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
    setIsSubmitting(true);
    
    // 检查是否正确匹配
    const leftItem = pairs[leftIndex];
    const rightItem = shuffledRight[rightIndex];
    const isCorrect = leftItem.originalIndex === rightItem.originalIndex;
    
    // 添加到匹配结果
    const newMatch = {
      leftIndex,
      rightIndex,
      isCorrect,
      leftText: leftItem.text,
      rightText: rightItem.text
    };
    
    setMatches(prev => [...prev, newMatch]);
    setSelectedLeft(null);
    setSelectedRight(null);
    
    // 如果所有配对完成，提交答案
    if (matches.length + 1 === pairs.length) {
      setTimeout(() => {
        onAnswer(newMatch); // 这里可能需要调整，根据实际需求
        setIsSubmitting(false);
      }, 300);
    } else {
      setIsSubmitting(false);
    }
  };

  // 重置选择
  const resetSelection = () => {
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  return (
    <div className="matching-container flex justify-between items-start bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      {/* 左侧列 */}
      <div className="matching-column w-1/2 pr-4">
        <h3 className="text-lg font-semibold mb-4 text-center">左侧</h3>
        <div className="space-y-3">
          {pairs.map((pair, index) => (
            <div
              key={`left-${index}`}
              className={`matching-item p-3 rounded-lg cursor-pointer transition-all duration-200 text-center ${
                selectedLeft === index 
                  ? 'bg-blue-100 border-2 border-blue-500' 
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
              }`}
              onClick={() => handleLeftClick(index)}
            >
              {pair.text}
            </div>
          ))}
        </div>
      </div>

      {/* 右侧列 */}
      <div className="matching-column w-1/2 pl-4">
        <h3 className="text-lg font-semibold mb-4 text-center">右侧</h3>
        <div className="space-y-3">
          {shuffledRight.map((pair, index) => (
            <div
              key={`right-${index}`}
              className={`matching-item p-3 rounded-lg cursor-pointer transition-all duration-200 text-center ${
                selectedRight === index 
                  ? 'bg-green-100 border-2 border-green-500' 
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
              }`}
              onClick={() => handleRightClick(index)}
            >
              {pair.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}