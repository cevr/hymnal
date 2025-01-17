import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Text, View } from 'react-native';

import { HymnScreen } from './hymn';
import { HymnsScreen } from './hymns';

export type RootStackParamList = {
  Hymns: undefined;
  Hymn: { id: number };
};

const Stack = createStackNavigator<RootStackParamList>();

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export default function RootStack() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Hymns"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Hymns"
          component={HymnsScreen}
        />
        <Stack.Screen
          name="Hymn"
          component={HymnScreen}
          layout={({ children }) => (
            <ErrorBoundary fallback={<Text>Something went wrong.</Text>}>
              <React.Suspense
                fallback={
                  <View>
                    <Text>Loading…</Text>
                  </View>
                }
              >
                {children}
              </React.Suspense>
            </ErrorBoundary>
          )}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
