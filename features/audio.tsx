import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import {
  Audio,
  AVPlaybackStatusSuccess,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from 'expo-av';
import * as React from 'react';
import { Platform } from 'react-native';

export const AudioSetupQueryOptions = queryOptions({
  queryKey: ['audio_setup'],
  queryFn: async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      playsInSilentModeIOS: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    return true;
  },
  staleTime: Infinity,
});

export const AudioQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['audio', id],
    queryFn: async () => {
      const { sound } = await Audio.Sound.createAsync(
        { uri: `https://cvr-hymns.s3.amazonaws.com/${id}.mp3` },
        {
          shouldPlay: false,
          isLooping: false,
        },
      );
      const status = await sound.getStatusAsync();
      if ('error' in status) {
        throw new Error(status.error);
      }
      return {
        player: sound,
        status: status as AVPlaybackStatusSuccess,
      };
    },
    staleTime: Infinity,
  });

export function useAudio(id: number) {
  const data = useSuspenseQuery(AudioQueryOptions(id)).data;
  const [status, setStatus] = React.useState(data.status);

  React.useEffect(() => {
    data.player.setOnPlaybackStatusUpdate((status) => {
      if ('error' in status) {
        throw new Error(status.error);
      }
      setStatus(status as AVPlaybackStatusSuccess);
    });
    return () => {
      data.player.unloadAsync();
    };
  }, []);

  return {
    playPause: async () => {
      if (status.isPlaying) {
        await data.player.pauseAsync();
      } else {
        await data.player.playAsync();
      }
    },
    seekTo: async (position: number) => {
      await data.player.setPositionAsync(
        Platform.OS === 'ios' ? position : position * 1000,
      );
    },
    position:
      Platform.OS === 'ios'
        ? status.positionMillis
        : status.positionMillis / 1000,
    duration:
      Platform.OS === 'ios'
        ? (status.durationMillis ?? 0)
        : (status.durationMillis ?? 0) / 1000,
    status,
  };
}
