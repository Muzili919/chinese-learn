import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { initGamificationState, updateExperience } from '../utils/gamification';
import { gradeEssay } from '../utils/ai';

export default function WritingPage({ user, onBack, onFinish }) {
  const [currentWriting, setCurrentWriting] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(false);
  const [score, setScore] = useState(0);

  // 加载写物题目
  useEffect(() => {
    const loadWriting = async () => {
      try {
        const response = await fetch('/data/writing/objects.json');
        const writings = await response.json();
        if (writings.length > 0) {
          const randomIndex = Math.floor(Math.random() * writings.length);
          setCurrentWriting(writings[randomIndex]);
        }
      } catch (error) {
        console.error('加载写物题目失败:', error);
      }
    };
    loadWriting();
  }, []);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    setIsSubmitting(true);
    setAiError(false);
    setAiResult(null);

    // 先用简单规则算一个基础分（作为 AI 降级方案）
    const wordCount = userAnswer.length;
    let baseScore = Math.min(10, Math.max(3, Math.floor(wordCount / 20)));
    const qualityBonus = wordCount > 200 ? 2 : wordCount > 100 ? 1 : 0;
    const fallbackScore = Math.min(15, baseScore + qualityBonus);

    try {
      // 调用 AI 批改
      const result = await gradeEssay(currentWriting?.title || '写物练习', userAnswer);
      setAiResult(result);
      const aiScore = result.score || fallbackScore * 10;
      setScore(aiScore);
    } catch (e) {
      console.error('AI批改失败:', e);
      setAiError(true);
      setScore(fallbackScore * 10);
    }

    setShowResult(true);

    // 更新用户经验
    if (user?.id) {
      const newExp = score > 0 ? score : fallbackScore * 10;
      updateExperience(user.id, newExp);

      const userData = storage.getUser();
      if (userData) {
        userData.experience = (userData.experience || 0) + newExp;
        userData.level = Math.floor(Math.sqrt(userData.experience / 100)) + 1;
        storage.setUser(userData);
      }
    }

    setIsSubmitting(false);
  };

  const handleRetry = () => {
    setShowResult(false);
    setUserAnswer('');
    setAiResult(null);
    setAiError(false);
  };

  if (!currentWriting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载写物题目...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50 p-4">
      <div className="max-w-md mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <h1 className="text-xl font-bold text-gray-800">写物练习</h1>
          <div className="w-5"></div>
        </div>

        {/* 题目卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-indigo-500">
          <h2 className="text-lg font-bold text-gray-800 mb-3">{currentWriting.title}</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">{currentWriting.prompt}</p>

          {currentWriting.example && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-800 mb-2">写作示例：</h3>
              <p className="text-blue-700 text-sm">{currentWriting.example}</p>
            </div>
          )}
        </div>

        {/* 写作区域 */}
        {!showResult ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">开始写作</h3>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="在这里写下你的作文..."
              className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              style={{ fontSize: '16px', lineHeight: '1.6' }}
            />

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {userAnswer.length} 字
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !userAnswer.trim()}
                className={`px-6 py-3 rounded-xl font-semibold text-white transition-all ${
                  isSubmitting || !userAnswer.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    AI 批改中...
                  </span>
                ) : '提交作文'}
              </button>
            </div>

            {/* 提交中的全屏 loading */}
            {isSubmitting && (
              <div className="mt-4 bg-indigo-50 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2" style={{ animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>🤖</div>
                <p className="text-sm font-semibold text-indigo-700">AI 老师正在批改你的作文...</p>
                <p className="text-xs text-indigo-400 mt-1">分析结构、内容、语言三个维度</p>
                <div className="mt-3 flex justify-center gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-indigo-400"
                      style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
                <style>{`
                  @keyframes spin { to { transform: rotate(360deg); } }
                  @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
                `}</style>
              </div>
            )}
          </div>
        ) : (
          /* 结果页面 */
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">作文提交成功！</h3>

              {/* 评分圆环 */}
              <div className="relative mx-auto mb-2" style={{ width: 80, height: 80 }}>
                <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                  <circle cx="40" cy="40" r="32" fill="none"
                    stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold" style={{ color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' }}>
                    {score}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {aiResult?.level || (score >= 80 ? '优秀' : score >= 60 ? '良好' : '继续加油')}
              </p>
            </div>

            {/* AI 批改结果 */}
            {aiResult && (
              <div className="space-y-3">
                {/* 优点 */}
                {aiResult.strengths?.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <h4 className="font-semibold text-green-700 mb-2 text-sm flex items-center gap-1">
                      <span>✅</span> 优点
                    </h4>
                    <ul className="text-green-700 text-sm space-y-1">
                      {aiResult.strengths.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 修改建议 */}
                {aiResult.suggestions?.length > 0 && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <h4 className="font-semibold text-amber-700 mb-2 text-sm flex items-center gap-1">
                      <span>💡</span> 修改建议
                    </h4>
                    <ul className="text-amber-700 text-sm space-y-1">
                      {aiResult.suggestions.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 优化示例 */}
                {aiResult.rewrite && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-700 mb-2 text-sm flex items-center gap-1">
                      <span>✏️</span> 优化示例
                    </h4>
                    <p className="text-blue-700 text-sm leading-relaxed">{aiResult.rewrite}</p>
                  </div>
                )}

                {/* 总评 */}
                {aiResult.comment && (
                  <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                    <h4 className="font-semibold text-violet-700 mb-2 text-sm flex items-center gap-1">
                      <span>👩‍🏫</span> 老师总评
                    </h4>
                    <p className="text-violet-700 text-sm leading-relaxed">{aiResult.comment}</p>
                  </div>
                )}
              </div>
            )}

            {/* AI 失败时的降级显示 */}
            {aiError && !aiResult && (
              <div className="space-y-4">
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <p className="text-yellow-700 text-sm">AI 批改暂时不可用，已使用基础评分。</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">基础评估：</h4>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• 字数达标：{userAnswer.length > 150 ? '是' : '否'} ({userAnswer.length}字)</li>
                    <li>• 内容完整：{userAnswer.length > 50 ? '是' : '否'}</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-4 bg-indigo-50 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-indigo-700 font-medium">获得经验值</span>
                <span className="text-indigo-700 font-bold">+{score} XP</span>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                再写一篇
              </button>
              <button
                onClick={() => onFinish({ type: 'writing', score })}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        )}

        {/* 写作提示 */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">写作小贴士：</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• 先想好要写的物体特点</li>
            <li>• 用上比喻、拟人等修辞手法</li>
            <li>• 注意开头和结尾要呼应</li>
            <li>• 多用四字词语让文章更生动</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
