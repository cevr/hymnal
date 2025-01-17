import '@/global.css';

import { GluestackUIProvider } from '@/features/ui/gluestack-ui-provider';
import * as React from 'react';

import 'react-native-gesture-handler';

import { DatabaseProvider } from './features/db/context';
import RootStack from './features/screens/root-stack';

export default function App() {
  return (
    <GluestackUIProvider mode="light">
      <React.Suspense fallback={null}>
        <DatabaseProvider>
          <RootStack />
        </DatabaseProvider>
      </React.Suspense>
    </GluestackUIProvider>
  );
}
