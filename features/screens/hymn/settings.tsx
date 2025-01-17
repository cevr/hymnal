import Slider from '@react-native-community/slider';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

type FontSettingsDrawerProps = {
  is_visible: boolean;
  on_close: () => void;
  font_settings: {
    font_size: number;
    line_height: number;
    font_family: string;
  };
  on_font_settings_change: (settings: {
    font_size: number;
    line_height: number;
    font_family: string;
  }) => void;
};

export function FontSettingsDrawer({
  is_visible,
  on_close,
  font_settings,
  on_font_settings_change,
}: FontSettingsDrawerProps) {
  return (
    <Modal
      visible={is_visible}
      animationType="slide"
      transparent={true}
      onRequestClose={on_close}
    >
      <View className="flex-1 justify-end">
        <View className="rounded-t-3xl bg-white p-4">
          <Text className="mb-4 text-xl font-bold">Font Settings</Text>
          <View className="mb-4">
            <Text className="mb-2">Font Size</Text>
            <Slider
              minimumValue={12}
              maximumValue={24}
              step={1}
              value={font_settings.font_size}
              onValueChange={(value) =>
                on_font_settings_change({ ...font_settings, font_size: value })
              }
            />
          </View>
          <View className="mb-4">
            <Text className="mb-2">Line Height</Text>
            <Slider
              minimumValue={1}
              maximumValue={2}
              step={0.1}
              value={font_settings.line_height}
              onValueChange={(value) =>
                on_font_settings_change({
                  ...font_settings,
                  line_height: value,
                })
              }
            />
          </View>
          <View className="mb-4">
            <Text className="mb-2">Font Family</Text>
            <TouchableOpacity
              className="rounded bg-gray-200 p-2"
              onPress={() =>
                on_font_settings_change({
                  ...font_settings,
                  font_family:
                    font_settings.font_family === 'System' ? 'Serif' : 'System',
                })
              }
            >
              <Text>{font_settings.font_family}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="rounded bg-black p-4"
            onPress={on_close}
          >
            <Text className="text-center text-white">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
