import { queryOptions } from '@tanstack/react-query';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';

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
