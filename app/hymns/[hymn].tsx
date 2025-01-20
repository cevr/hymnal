import { Icon } from '@roninoss/icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ScrollView, View } from 'react-native';

import { Button } from '~/components/nativewindui/button';
import { Slider } from '~/components/nativewindui/slider';
import { Text } from '~/components/nativewindui/text';
import { useAudio } from '~/features/audio';
import { ToggleFavoriteButton } from '~/features/hymns/toggle-favorite-button';
import { useColorScheme } from '~/lib/use-color-scheme';

import { useHymn, useUpdateHymnViews } from '../../features/db/context';

export default function HymnScreen(): React.ReactElement {
  const params = useLocalSearchParams<{
    hymn: string;
  }>();

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
        {/* above 695 is not music but call/response */}
        {id <= 695 ? (
          <ErrorBoundary fallback={null}>
            <View className="bg-background">
              <AudioPlayer id={id} />
            </View>
          </ErrorBoundary>
        ) : null}
      </View>
    </>
  );
}

type Refrain = {
  id: number;
  text: string;
  type: 'refrain';
};

type Verse = {
  id: number;
  text: string;
  type: 'verse';
};

type Lyric = Refrain | Verse;

function HymnLyrics({ id }: { id: number }): React.ReactNode {
  const hymn = useHymn(id);

  const { refrains: refrains, verses } = hymn.verses.reduce(
    (acc, lyric) => {
      if (lyric.id < 0) {
        acc.refrains.push({
          id: lyric.id,
          text: lyric.text,
          type: 'refrain',
        });
      } else {
        acc.verses.push({
          id: lyric.id,
          text: lyric.text,
          type: 'verse',
        });
      }
      return acc;
    },
    { refrains: [] as Lyric[], verses: [] as Lyric[] },
  );

  // interleave verses and refrains
  const interleaved = verses.reduce((acc, verse, index) => {
    acc.push(verse);
    const refrain = refrains[index];
    if (refrain) {
      acc.push(refrain);
    }
    return acc;
  }, [] as Lyric[]);

  return (
    <ScrollView className="flex-1 gap-4 bg-card p-4">
      <Text
        variant="title2"
        className="mb-4 font-bold text-foreground"
      >
        {hymn.name}
      </Text>
      {interleaved.map((lyric, index) => (
        <View
          key={index}
          className="mb-4 gap-1"
        >
          <Text
            className="font-semibold text-gray-600 dark:text-gray-400"
            variant="subhead"
          >
            {lyric.type === 'refrain'
              ? refrains.length > 1
                ? `Refrain ${Math.abs(lyric.id)}`
                : 'Refrain'
              : `Verse ${lyric.id + 1}`}
          </Text>
          <Text
            className="text-foreground"
            variant="body"
          >
            {lyric.text}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

type AudioPlayerProps = {
  id: number;
};

export function AudioPlayer({ id }: AudioPlayerProps): React.ReactNode {
  const player = useAudio(id);
  const { colors } = useColorScheme();

  return (
    <View className="flex-row items-center justify-between border-t-2 border-gray-200 bg-background p-4 pb-12 dark:border-gray-800">
      <View className="flex-1 flex-row items-center gap-4">
        <Button
          hitSlop={10}
          variant="plain"
          onPress={player.playPause}
        >
          {player.status.isPlaying ? (
            <Icon
              name="pause"
              size={24}
              color={colors.foreground}
            />
          ) : (
            <Icon
              name="play"
              size={24}
              color={colors.foreground}
            />
          )}
        </Button>
        <Slider
          style={{ flex: 1 }}
          minimumValue={0}
          maximumValue={1}
          value={player.position / (player.duration ?? 0)}
          onValueChange={(value) => {
            player.seekTo((player.duration ?? 0) * value);
          }}
        />
        <Text variant="subhead">
          {secondsToMinutes(player.position)} /{' '}
          {secondsToMinutes(player.duration ?? 0)}
        </Text>
      </View>
    </View>
  );
}

function secondsToMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60000);
  const remainingSeconds = Math.floor((seconds % 60000) / 1000);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
