import Slider from '@react-native-community/slider';
import { Icon } from '@roninoss/icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { Suspense, useEffect, useState } from 'react';
import { Modal, ScrollView, TouchableOpacity, View } from 'react-native';

import { Button } from '~/components/nativewindui/button';
import { Text } from '~/components/nativewindui/text';
import { ToggleFavoriteButton } from '~/features/hymns/toggle-favorite-button';
import { useColorScheme } from '~/lib/use-color-scheme';

import { Hymn, useHymn, useUpdateHymnViews } from '../../features/db/context';

type Lyric = { id: number; text: string };

export default function HymnScreen(): React.ReactElement {
  const params = useLocalSearchParams<{
    hymn: string;
  }>();
  const { colors } = useColorScheme();

  const hymn = useHymn(+params.hymn);
  const handle_view_update = useUpdateHymnViews();

  React.useEffect(() => {
    handle_view_update(hymn.id);
  }, [hymn.id]);

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
    <>
      <Stack.Screen
        options={{
          title: `${hymn.id}`,

          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },

          headerLeft: () => (
            <Button
              variant="plain"
              onPress={() => router.back()}
              hitSlop={10}
            >
              <Icon
                size={24}
                name="chevron-left"
                color={colors.primary}
              />
            </Button>
          ),
        }}
      />
      <View className="flex-1 bg-white">
        <ScrollView className="flex-1 gap-4 bg-white p-4">
          <Text
            variant="title2"
            className="mb-4 font-bold"
          >
            {hymn.name}
          </Text>
          {formatted_lyrics.map((lyric, index) => (
            <View
              key={index}
              className="mb-4 gap-1"
            >
              <Text
                className="font-semibold"
                variant="caption2"
              >
                {lyric.id === -1 ? 'Refrain' : `Verse ${lyric.id + 1}`}
              </Text>
              <Text variant="body">{lyric.text}</Text>
            </View>
          ))}
        </ScrollView>
        <View className="border-t border-gray-200 bg-white">
          <Suspense fallback={<Text>Loading audio...</Text>}>
            <AudioPlayer hymn={hymn} />
          </Suspense>
        </View>
      </View>
    </>
  );
}

type AudioPlayerProps = {
  hymn: Hymn;
};

export function AudioPlayer({ hymn }: AudioPlayerProps): React.ReactElement {
  const [is_playing, set_is_playing] = useState<boolean>(false);
  const [progress, set_progress] = useState<number>(0);

  // Mock audio loading
  useEffect(() => {
    // Simulate audio loading
    const timeout: NodeJS.Timeout = setTimeout(() => {
      // Audio loaded
    }, 1000);

    return () => clearTimeout(timeout);
  }, [hymn.id]);

  return (
    <View className="flex-row items-center justify-between p-4 pb-8">
      <View className="flex-1 flex-row items-center">
        <TouchableOpacity
          onPress={() => set_is_playing(!is_playing)}
          className="mr-4"
        >
          {is_playing ? (
            <Icon
              name="pause"
              size={24}
              color="#000"
            />
          ) : (
            <Icon
              name="play"
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
      <ToggleFavoriteButton id={hymn.id} />
    </View>
  );
}
