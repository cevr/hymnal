import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  Pause,
  Play,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import React, { Suspense, useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import {
  Hymn,
  useHymn,
  useSettings,
  useToggleHymnFavorite,
  useUpdateHymnViews,
  useUpdateSettings,
} from '../../features/db/context';

export default function HymnScreen(): React.ReactElement {
  const params = useLocalSearchParams<{
    hymn: string;
  }>();

  const hymn = useHymn(+params.hymn);
  const font_settings = useSettings();
  const handle_font_settings_change = useUpdateSettings();
  const handle_view_update = useUpdateHymnViews();
  const [show_font_settings, set_show_font_settings] = useState<boolean>(false);

  React.useEffect(() => {
    handle_view_update(hymn.id);
  }, [hymn.id]);

  type Lyric = { id: number; text: string };

  const { refrain, verses }: { refrain: Lyric[]; verses: Lyric[] } =
    hymn.verses.reduce(
      (acc: { refrain: Lyric[]; verses: Lyric[] }, lyric: Lyric) => {
        if (lyric.id === -1) {
          acc.refrain.push(lyric);
        } else {
          acc.verses.push(lyric);
        }
        return acc;
      },
      { refrain: [], verses: [] },
    );

  const formatted_lyrics: Lyric[] = [verses[0], ...refrain, ...verses.slice(1)];

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between bg-white p-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft
            size={24}
            color="#000"
          />
        </TouchableOpacity>
        <Text className="text-lg font-bold">{hymn.name}</Text>
        <TouchableOpacity onPress={() => set_show_font_settings(true)}>
          <SettingsIcon
            size={24}
            color="#000"
          />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 p-4">
        {formatted_lyrics.map((lyric, index) => (
          <View
            key={index}
            className="mb-4"
          >
            <Text className="mb-2 font-bold">
              {lyric.id === -1 ? 'Refrain' : `Verse ${lyric.id}`}
            </Text>
            <Text
              style={{
                fontSize: font_settings.font_size,
                lineHeight: font_settings.font_size * font_settings.line_height,
                fontFamily: font_settings.font_family,
              }}
            >
              {lyric.text}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View className="border-t border-gray-200 bg-white">
        <Suspense fallback={<Text>Loading audio...</Text>}>
          <AudioPlayer hymn={hymn} />
        </Suspense>
      </View>
      <FontSettingsDrawer
        is_visible={show_font_settings}
        on_close={() => set_show_font_settings(false)}
        font_settings={font_settings}
        on_font_settings_change={handle_font_settings_change}
      />
    </View>
  );
}

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

type AudioPlayerProps = {
  hymn: Hymn;
};

export function AudioPlayer({ hymn }: AudioPlayerProps): React.ReactElement {
  const [is_playing, set_is_playing] = useState<boolean>(false);
  const [progress, set_progress] = useState<number>(0);
  const handle_favorite_toggle = useToggleHymnFavorite();

  // Mock audio loading
  useEffect(() => {
    // Simulate audio loading
    const timeout: NodeJS.Timeout = setTimeout(() => {
      // Audio loaded
    }, 1000);

    return () => clearTimeout(timeout);
  }, [hymn.id]);

  return (
    <View className="flex-row items-center justify-between p-4">
      <View className="flex-1 flex-row items-center">
        <TouchableOpacity
          onPress={() => set_is_playing(!is_playing)}
          className="mr-4"
        >
          {is_playing ? (
            <Pause
              size={24}
              color="#000"
            />
          ) : (
            <Play
              size={24}
              color="#000"
            />
          )}
        </TouchableOpacity>
        <Slider
          style={{ flex: 1 }}
          minimumValue={0}
          maximumValue={1}
          value={progress}
          onValueChange={set_progress}
          minimumTrackTintColor="#000"
          maximumTrackTintColor="#9CA3AF"
        />
      </View>
      <TouchableOpacity
        onPress={() => handle_favorite_toggle(hymn.id)}
        className="ml-4"
      >
        <Heart
          size={24}
          color={hymn.favorite ? '#EF4444' : '#6B7280'}
          fill={hymn.favorite ? '#EF4444' : 'none'}
        />
      </TouchableOpacity>
    </View>
  );
}
