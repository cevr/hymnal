import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { HymnScreen } from './hymn/hymn';
import { HymnsScreen } from './hymns/hymns';

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
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
