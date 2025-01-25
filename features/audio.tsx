import { Icon } from '@roninoss/icons';
import { queryOptions } from '@tanstack/react-query';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import * as React from 'react';
import { View } from 'react-native';

import { Button } from '~/components/nativewindui/button';
import { Slider } from '~/components/nativewindui/slider';
import { Text } from '~/components/nativewindui/text';
import { useColorScheme } from '~/lib/use-color-scheme';

export const AudioSetupQueryOptions = queryOptions({
  queryKey: ['audio_setup'],
  queryFn: async () => {
    await setAudioModeAsync({
      shouldPlayInBackground: true,
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      shouldRouteThroughEarpiece: false,
      allowsRecording: false,
    });
    return true;
  },
  staleTime: Infinity,
});

export function useAudio(id: number) {
  const player = useAudioPlayer(`https://cvr-hymns.s3.amazonaws.com/${id}.mp3`);
  const status = useAudioPlayerStatus(player);

  return {
    player,
    status,
  };
}

export function AudioPlayerFallback(): React.ReactNode {
  return (
    <View
      style={{ height: AUDIO_HEIGHT }}
      className="border-t-2 border-gray-200 bg-background dark:border-gray-800"
    ></View>
  );
}

export const AUDIO_HEIGHT = 104;

type AudioPlayerProps = {
  id: number;
};

export const AudioPlayer = React.memo(function AudioPlayer({
  id,
}: AudioPlayerProps): React.ReactNode {
  const { player, status } = useAudio(id);
  const { colors } = useColorScheme();

  return (
    <View
      className="flex-row items-center justify-between gap-4 border-t-2 border-gray-200 bg-background p-4 pb-12 dark:border-gray-800"
      style={{ height: AUDIO_HEIGHT }}
    >
      <Button
        hitSlop={10}
        variant="plain"
        onPress={() => {
          if (status.playing) {
            player.pause();
          } else {
            player.play();
          }
        }}
      >
        <Icon
          name={status.playing ? 'pause' : 'play'}
          size={24}
          color={colors.foreground}
        />
      </Button>
      <Slider
        style={{ flex: 1 }}
        minimumValue={0}
        maximumValue={1}
        value={status.currentTime / status.duration}
        onValueChange={(value) => {
          void player.seekTo(status.duration * value);
        }}
      />
      <Text variant="subhead">
        {secondsToMinutes(player.currentTime)} /{' '}
        {secondsToMinutes(player.duration)}
      </Text>
    </View>
  );
});

function secondsToMinutes(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;
}
