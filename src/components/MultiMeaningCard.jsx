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
    
    // 延迟提交，让用户看到选择效果
    setTimeout(() => {
      onAnswer(optionId);
      setIsSubmitting(false);
    }, 300);
  };

  const renderQuestionText = () => {
    let text = question;
    
    // 替换填空部分
    parsedBlanks.forEach(blank => {
      text = text.replace(blank.placeholder, 
        `<span class="inline-block min-w-8 h-6 bg-yellow-100 border-b-2 border-dashed border-gray-400 align-middle mx-1"></span>`
      );
    });
    
    return <div dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return (
    <div className="space-y-6">
      {/* 题目进度 */}
      <div className="text-sm text-gray-500 text-center">
        第 {currentQuestion} 题 / 共 {totalQuestions} 题
      </div>

      {/* 题目内容 */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="text-lg font-medium leading-relaxed mb-4">
          {renderQuestionText()}
        </div>
        
        {/* 选项按钮 */}
        <div className="multi-meaning-options">
          {parsedOptions.map((option) => (
            <button
              key={option.id}
              className={`multi-meaning-option font-medium transition-all duration-200 ${
                selectedAnswer === option.id
                  ? 'bg-blue-500 text-white shadow-md transform scale-105'
                  : isSubmitting
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
              }`}
              onClick={() => !isSubmitting && handleSelect(option.id)}
              disabled={isSubmitting}
            >
              {option.id}{option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}