import { ScreenContent } from '@/features/ui/ScreenContent';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StyleSheet, View } from 'react-native';

import { RootStackParamList } from './root-stack';
import { Button } from '../ui/Button';

type OverviewScreenNavigationProps = StackNavigationProp<
  RootStackParamList,
  'Overview'
>;

export default function Overview() {
  const navigation = useNavigation<OverviewScreenNavigationProps>();

  return (
    <View style={styles.container}>
      <ScreenContent
        path="features/screens/overview.tsx"
        title="Overview"
      />
      <Button
        onPress={() => navigation.navigate('Details', { id })}
        title="Show Details"
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});
