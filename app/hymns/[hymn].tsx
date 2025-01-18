import { Icon } from '@roninoss/icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { Suspense, useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

import { Slider } from '~/components/nativewindui/slider';
import { Text } from '~/components/nativewindui/text';
import { ToggleFavoriteButton } from '~/features/hymns/toggle-favorite-button';
import { useColorScheme } from '~/lib/use-color-scheme';

import { Lyric, useHymn, useUpdateHymnViews } from '../../features/db/context';

export default function HymnScreen(): React.ReactElement {
  const params = useLocalSearchParams<{
    hymn: string;
  }>();
  const { colors } = useColorScheme();

  const handleViewUpdate = useUpdateHymnViews();

  const id = parseInt(params.hymn, 10);

  React.useEffect(() => {
    handleViewUpdate(id);
  }, [id]);

  return (
    <>
      <Stack.Screen
        options={{
          title: params.hymn,
          headerRight: () => <ToggleFavoriteButton id={id} />,
        }}
      />
      <View className="flex-1">
        <React.Suspense fallback={null}>
          <HymnLyrics id={id} />
        </React.Suspense>
        <View
          className="border-t border-gray-200"
          style={{
            backgroundColor: colors.background,
          }}
        >
          <Suspense fallback={<Text>Loading audio...</Text>}>
            <AudioPlayer id={id} />
          </Suspense>
        </View>
      </View>
    </>
  );
}

function HymnLyrics({ id }: { id: number }): React.ReactNode {
  const hymn = useHymn(id);

  const { refrain, verses } = hymn.verses.reduce(
    (acc, lyric) => {
      if (lyric.id === -1) {
        acc.refrain.push(lyric);
      } else {
        acc.verses.push(lyric);
      }
      return acc;
    },
    { refrain: [] as Lyric[], verses: [] as Lyric[] },
  );

  const formattedLyrics = [verses[0], ...refrain, ...verses.slice(1)];

  return (
    <ScrollView className="flex-1 gap-4 bg-white p-4">
      <Text
        variant="title2"
        className="mb-4 font-bold"
      >
        {hymn.name}
      </Text>
      {formattedLyrics.map((lyric, index) => (
        <View
          key={index}
          className="mb-4 gap-1"
        >
          <Text
            className="font-semibold"
            variant="subhead"
          >
            {lyric.id === -1 ? 'Refrain' : `Verse ${lyric.id + 1}`}
          </Text>
          <Text variant="body">{lyric.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

type AudioPlayerProps = {
  id: number;
};

export function AudioPlayer({ id }: AudioPlayerProps): React.ReactElement {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Mock audio loading
  useEffect(() => {
    // Simulate audio loading
    const timeout: NodeJS.Timeout = setTimeout(() => {
      // Audio loaded
    }, 1000);

    return () => clearTimeout(timeout);
  }, [id]);

  return (
    <View className="flex-row items-center justify-between p-4 pb-12">
      <View className="flex-1 flex-row items-center">
        <TouchableOpacity
          onPress={() => setIsPlaying(!isPlaying)}
          className="mr-4"
        >
          {isPlaying ? (
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
          onValueChange={setProgress}
        />
      </View>
    </View>
  );
}
