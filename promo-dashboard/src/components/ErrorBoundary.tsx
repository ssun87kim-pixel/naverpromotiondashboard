import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-6 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-gray-700 text-sm">이 섹션을 불러오는 중 오류가 발생했습니다</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
