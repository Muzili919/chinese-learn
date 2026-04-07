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
      return (
        <div style={{ padding: 20, color: 'red', background: '#fff', minHeight: '100vh' }}>
          <h1>应用出错了</h1>
          <p>{this.state.error?.message}</p>
          <pre style={{ fontSize: 10, overflow: 'auto', maxHeight: '80vh' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
