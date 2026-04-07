import React, { useState, useEffect } from 'react';
import '../styles/fill-blank-mobile.css';

export default function FillBlankInput({ 
  question,
  answer = '',
  onAnswerChange,
  onSubmit,
  isSubmitting = false,
  showResult = false,
  score = 0,
  feedback = '',
  referenceAnswer = ''
}) {
  const [userAnswer, setUserAnswer] = useState(answer);
  
  useEffect(() => {
    if (answer) {
      setUserAnswer(answer);
    }
  }, [answer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userAnswer.trim()) {
      onAnswerChange(userAnswer);
      onSubmit(userAnswer);
    }
  };

  if (showResult) {
    return (
      <div className="space-y-4">
        {/* 显示题目 */}
        {question && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4 mobile-question-card">
            <div className="flex gap-2 mb-2">
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">填空题</span>
            </div>
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{question}</div>
          </div>
        )}

        {/* 用户答案 */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-sm text-gray-600 mb-2">你的答案：</p>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <p className="text-gray-800 whitespace-pre-wrap">{userAnswer || '（未作答）'}</p>
          </div>
        </div>

        {/* 参考答案 */}
        {referenceAnswer && (
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-sm text-blue-600 mb-2">参考答案：</p>
            <div className="bg-white rounded-xl p-3 border border-blue-200">
              <p className="text-blue-800 whitespace-pre-wrap">{referenceAnswer}</p>
            </div>
          </div>
        )}

        {/* 评分反馈 */}
        {score > 0 && (
          <div className={`rounded-2xl p-4 text-center ${
            score >= 80 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className="font-semibold">
              {score >= 80 ? '✓ 回答正确！' : '⚠️ 部分正确'}
            </p>
            <p className="text-sm mt-1">
              得分：{score}分
            </p>
            {feedback && <p className="text-sm mt-2 text-gray-600">{feedback}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 显示题目 */}
      {question && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 mobile-question-card">
          <div className="flex gap-2 mb-2">
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">填空题</span>
          </div>
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{question}</div>
        </div>
      )}

      {/* 答题区域 */}
      <div className="space-y-3">
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="请输入你的答案..."
          className="mobile-fill-blank-input"
          style={{ fontSize: '16px' }}
        />
        
        <div className="mobile-fill-blank-buttons">
          <button
            type="submit"
            disabled={isSubmitting || !userAnswer.trim()}
            className="mobile-fill-blank-button bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
          >
            {isSubmitting ? '提交中...' : '提交答案'}
          </button>
          
          {userAnswer && (
            <button
              type="button"
              onClick={() => setUserAnswer('')}
              className="mobile-fill-blank-button bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            >
              清空
            </button>
          )}
        </div>
      </div>
    </form>
  );
}