import React, { useState } from 'react';

export default function MultiMeaningCard({ 
  question, 
  options, 
  onAnswer, 
  currentQuestion, 
  totalQuestions 
}) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 解析题目中的选项
  const parseOptions = (questionText) => {
    const optionMatches = questionText.match(/[①②③④⑤⑥⑦⑧⑨⑩][^①②③④⑤⑥⑦⑧⑨⑩]+/g) || [];
    return optionMatches.map(match => ({
      id: match.charAt(0),
      text: match.substring(1).trim()
    }));
  };

  // 解析题目中的填空
  const parseBlanks = (questionText) => {
    const blankMatches = questionText.match(/\(.*?\)/g) || [];
    return blankMatches.map((blank, index) => ({
      index: index + 1,
      placeholder: blank
    }));
  };

  const parsedOptions = parseOptions(question);
  const parsedBlanks = parseBlanks(question);

  const handleSelect = (optionId) => {
    setSelectedAnswer(optionId);
    setIsSubmitting(true);
    
    // 延迟提交，让用户看到选择
    setTimeout(() => {
      onAnswer(optionId);
      setSelectedAnswer(null);
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-indigo-500">
      {/* 题目编号 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          第 {currentQuestion} 题 / 共 {totalQuestions} 题
        </span>
      </div>

      {/* 题目内容 */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">多义字选择</h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{question}</p>
      </div>

      {/* 选项按钮 - 横向排列 */}
      {parsedOptions.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">请选择正确的解释：</h4>
          <div className="flex flex-wrap gap-2">
            {parsedOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => !isSubmitting && handleSelect(option.id)}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedAnswer === option.id
                    ? 'bg-indigo-600 text-white transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className="font-bold">{option.id}</span>
                <span className="ml-1">{option.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 填空提示 */}
      {parsedBlanks.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">答题提示：</h4>
          <p className="text-yellow-700 text-sm">
            点击上面的选项按钮，将序号填入括号中
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {parsedBlanks.map((blank, index) => (
              <span key={index} className="inline-block bg-white px-3 py-1 rounded border border-yellow-300 text-yellow-800">
                ({index + 1}) {blank.placeholder}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
