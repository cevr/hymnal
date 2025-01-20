import * as React from 'react';

import '../global.css';
import 'expo-dev-client';

import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { cache } from '~/features/cache';
import { RootProvider } from '~/features/root-provider';
import {
  useColorScheme,
  useInitialAndroidBarSync,
} from '~/lib/use-color-scheme';
import { NAV_THEME } from '~/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme, colors } = useColorScheme();

  return (
    <>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
        style={isDarkColorScheme ? 'light' : 'dark'}
      />

      <NavThemeProvider value={NAV_THEME[colorScheme]}>
        <QueryClientProvider client={cache}>
          <RootProvider>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: colors.background,
                },
              }}
            />
            <PortalHost />
          </RootProvider>
        </QueryClientProvider>
      </NavThemeProvider>
    </>
  );
}
