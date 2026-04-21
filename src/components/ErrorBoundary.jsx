import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem', textAlign: 'center', color: '#666',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
        }}>
          <div style={{ fontSize: '3rem' }}>😵</div>
          <h3>页面出了点问题</h3>
          <p style={{ fontSize: '0.85rem', color: '#999' }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none',
              background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
