import * as React from 'react';

import '../global.css';
import 'expo-dev-client';

import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DatabaseProvider } from '~/features/db/context';
import { NAV_THEME } from '~/lib/theme';
import {
  useColorScheme,
  useInitialAndroidBarSync,
} from '~/lib/use-color-scheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme } = useColorScheme();

  return (
    <>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
        style={isDarkColorScheme ? 'light' : 'dark'}
      />

      <NavThemeProvider value={NAV_THEME[colorScheme]}>
        <DatabaseProvider>
          <Stack />
        </DatabaseProvider>
      </NavThemeProvider>
    </>
  );
}
