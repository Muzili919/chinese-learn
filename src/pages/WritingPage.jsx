import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { initGamificationState, updateExperience } from '../utils/gamification';

export default function WritingPage({ user, onBack, onFinish }) {
  const [currentWriting, setCurrentWriting] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
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
    
    // 模拟评分（实际可以集成AI评分）
    const wordCount = userAnswer.trim().split(/\s+/).length;
    let baseScore = Math.min(10, Math.max(3, Math.floor(wordCount / 20)));
    
    // 根据内容质量调整分数
    const qualityBonus = userAnswer.length > 200 ? 2 : userAnswer.length > 100 ? 1 : 0;
    const scoreTotal = Math.min(15, baseScore + qualityBonus);
    
    setScore(scoreTotal);
    setShowResult(true);
    
    // 更新用户经验
    if (user?.id) {
      const newExp = scoreTotal * 10;
      updateExperience(user.id, newExp);
      
      // 保存到本地存储
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
                {isSubmitting ? '提交中...' : '提交作文'}
              </button>
            </div>
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
              <p className="text-gray-600">你的写作获得了 {score} 分</p>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">评分标准：</h4>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• 字数达标：{userAnswer.length > 150 ? '✓' : '✗'} ({userAnswer.length}字)</li>
                  <li>• 内容完整：{userAnswer.length > 50 ? '✓' : '✗'}</li>
                  <li>• 描写生动：根据内容质量评估</li>
                </ul>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-800 mb-2">获得奖励：</h4>
                <div className="flex items-center justify-between">
                  <span className="text-indigo-700">+{score * 10} 经验值</span>
                  <span className="text-indigo-700">+{score} 星星</span>
                </div>
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
