import React, { useState, useEffect } from 'react';

// 智能批改算法 - 包含关键词就给分
function smartGrade(userAnswer, correctAnswer) {
  if (!userAnswer || !correctAnswer) return { score: 0, feedback: '请提供答案' };
  
  const userWords = userAnswer.toLowerCase().trim();
  const correctWords = correctAnswer.toLowerCase().trim();
  
  // 完全匹配
  if (userWords === correctWords) {
    return { score: 100, feedback: '完全正确！' };
  }
  
  // 关键词匹配
  const keywords = correctWords.split(/[，。、；：\s]+/).filter(word => word.length > 1);
  let matchedKeywords = 0;
  
  for (const keyword of keywords) {
    if (userWords.includes(keyword)) {
      matchedKeywords++;
    }
  }
  
  const matchRate = keywords.length > 0 ? matchedKeywords / keywords.length : 0;
  
  if (matchRate >= 0.8) {
    return { score: 100, feedback: '回答正确！' };
  } else if (matchRate >= 0.5) {
    return { score: 70, feedback: '基本正确，但可以更完整' };
  } else if (matchRate >= 0.3) {
    return { score: 50, feedback: '部分正确，请再思考一下' };
  } else {
    return { score: 0, feedback: '答案不够准确，请参考正确答案' };
  }
}

export default function ReadingAnswerInput({ 
  questionText,
  correctAnswer,
  onGradeComplete,
  onSelfAssess
}) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [gradeResult, setGradeResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;
    
    const result = smartGrade(userAnswer, correctAnswer);
    setGradeResult(result);
    setIsSubmitted(true);
    onGradeComplete(result.score >= 70, userAnswer);
  };

  const handleSelfAssess = (isCorrect) => {
    setIsSubmitted(true);
    onSelfAssess(isCorrect, userAnswer);
  };

  if (isSubmitted && gradeResult) {
    return (
      <div className="space-y-4">
        {/* 题目显示 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
          <div className="flex gap-2 mb-2">
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">阅读理解</span>
          </div>
          <p className="text-gray-800 whitespace-pre-wrap">{questionText}</p>
        </div>

        {/* 用户答案 */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 mb-2">你的答案：</h3>
          <p className="text-blue-700 whitespace-pre-wrap">{userAnswer}</p>
        </div>

        {/* 批改结果 */}
        <div className={`rounded-xl p-4 ${gradeResult.score >= 70 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`font-bold ${gradeResult.score >= 70 ? 'text-green-700' : 'text-red-700'}`}>
              {gradeResult.score >= 70 ? '✓ 正确' : '✗ 需要改进'}
            </span>
            <span className="text-sm text-gray-600">({gradeResult.score}分)</span>
          </div>
          <p className="text-gray-700">{gradeResult.feedback}</p>
        </div>

        {/* 正确答案 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-2">参考答案：</h3>
          <p className="text-gray-700">{correctAnswer}</p>
        </div>

        {/* 继续按钮 */}
        <button 
          onClick={() => setIsSubmitted(false)}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          继续下一题
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 题目显示 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
        <div className="flex gap-2 mb-2">
          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">阅读理解</span>
        </div>
        <p className="text-gray-800 whitespace-pre-wrap">{questionText}</p>
      </div>

      {/* 答题区域 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            请输入你的答案：
          </label>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="请在此输入你的答案..."
            className="w-full min-h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
            style={{ fontSize: '16px' }}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!userAnswer.trim()}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            智能批改
          </button>
          <button
            type="button"
            onClick={() => handleSelfAssess(true)}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            自评正确
          </button>
          <button
            type="button"
            onClick={() => handleSelfAssess(false)}
            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            自评错误
          </button>
        </div>
      </form>
    </div>
  );
}