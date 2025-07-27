import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="max-w-2xl mx-auto mt-6 text-right">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>حدث خطأ</AlertTitle>
          <AlertDescription>{this.state.error?.message || 'خطأ غير معروف'}</AlertDescription>
        </Alert>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;