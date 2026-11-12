import React from 'react';
import type { ErrorInfo, PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { ErrorState } from './ErrorState';
import { useTheme } from '../theme/ThemeProvider';

interface Props extends PropsWithChildren {
  onReset?: () => void;
}
interface State {
  hasError: boolean;
}

function BoundaryFallback({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ErrorState
        title="Algo salió mal"
        message="Puedes volver a intentarlo para recuperar la tienda."
        onRetry={onRetry}
      />
    </SafeAreaView>
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      'MiniTienda render error',
      error.message,
      info.componentStack,
    );
  }

  private retry = () => {
    this.props.onReset?.();
    this.setState({ hasError: false });
  };

  render() {
    return this.state.hasError ? (
      <BoundaryFallback onRetry={this.retry} />
    ) : (
      this.props.children
    );
  }
}

const styles = StyleSheet.create({ root: { flex: 1 } });
