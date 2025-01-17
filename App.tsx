import '@/global.css';

import { GluestackUIProvider } from '@/features/ui/styles';

import 'react-native-gesture-handler';

import RootStack from './features/navigation';

export default function App() {
  return (
    <GluestackUIProvider mode="light">
      <RootStack />
    </GluestackUIProvider>
  );
}
