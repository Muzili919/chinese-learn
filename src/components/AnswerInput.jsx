import React, { useState, useEffect } from 'react';

export default function AnswerInput({ 
  answer, 
  onAnswerChange, 
  onSubmit, 
  isSubmitting = false,
  showResult = false,
  score = 0,
  feedback = '',
  referenceAnswer = ''
}) {
  const [userAnswer, setUserAnswer] = useState(answer || '');
  
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
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-green-800">你的答案</h3>
            <span className="text-green-600 font-bold">{score}分</span>
          </div>
          <p className="text-green-700 mt-2">{userAnswer}</p>
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">参考答案</h3>
          <p className="text-blue-700 mt-2">{referenceAnswer}</p>
        </div>
        
        {feedback && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800">批改反馈</h3>
            <p className="text-yellow-700 mt-2">{feedback}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          请在这里写下你的答案
        </label>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="请输入你的答案..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          style={{ fontSize: '16px', lineHeight: '1.6' }}
        />
        <div className="text-right text-sm text-gray-500 mt-1">
          {userAnswer.length} 字
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting || !userAnswer.trim()}
        className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-all ${
          isSubmitting || !userAnswer.trim()
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-[1.02]'
        }`}
      >
        {isSubmitting ? '提交中...' : '提交答案'}
      </button>
    </form>
  );
}
