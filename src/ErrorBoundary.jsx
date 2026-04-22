import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || ''
      // 部署后旧 hash 文件 404 → 自动刷新一次加载新版本
      if (msg.includes('Failed to fetch dynamically imported module') && !location.search.includes('_retry')) {
        location.href = location.pathname + '?_retry=1'
        return null
      }
      return (
        <div style={{ padding: 20, color: '#333', background: '#fff', minHeight: '100vh' }}>
          <h1 style={{ color: '#e53e3e' }}>应用出错了</h1>
          <p>{msg}</p>
          <button
            onClick={() => location.reload()}
            style={{ marginTop: 16, padding: '8px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}
          >
            点击刷新
          </button>
          <pre style={{ fontSize: 10, overflow: 'auto', maxHeight: '60vh', marginTop: 16, background: '#f7f7f7', padding: 12, borderRadius: 8 }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
