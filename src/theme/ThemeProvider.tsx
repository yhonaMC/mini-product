import React, { createContext, useContext, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from './tokens';
import type { ThemeColors } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemMode = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const isDark = mode === 'system' ? systemMode === 'dark' : mode === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        colors: isDark ? darkColors : lightColors,
        isDark,
        mode,
        setMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme requires a ThemeProvider');
  }
  return theme;
}
