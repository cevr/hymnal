import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { BackButton } from '../ui/BackButton';
import Details from './details';
import Overview from './overview';

export type RootStackParamList = {
  Hymns: undefined;
  Hymn: { id: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootStack() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Hymns">
        <Stack.Screen
          name="Hymns"
          component={Overview}
        />
        <Stack.Screen
          name="Hymn"
          component={Details}
          options={({ navigation }) => ({
            headerLeft: () => <BackButton onPress={navigation.goBack} />,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
