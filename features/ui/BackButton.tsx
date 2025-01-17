import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export const BackButton = ({ onPress }: { onPress: () => void }) => {
  return (
    <View className="flex-row">
      <Feather
        name="chevron-left"
        size={16}
        color="#007AFF"
      />
      <Text
        className="ml-1 text-blue-500"
        onPress={onPress}
      >
        Back
      </Text>
    </View>
  );
};
