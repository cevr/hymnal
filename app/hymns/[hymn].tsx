import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Dimensions, ScrollView, View } from 'react-native';

import { Text } from '~/components/nativewindui/text';
import {
  AUDIO_HEIGHT,
  AudioPlayer,
  AudioPlayerFallback,
} from '~/features/audio';
import { ToggleFavoriteButton } from '~/features/hymns/toggle-favorite-button';

import {
  useHymn,
  useHymns,
  useUpdateHymnViews,
} from '../../features/db/context';

const HEADER_HEIGHT = 100;

export default function HymnScreen(): React.ReactElement {
  const params = useLocalSearchParams<{
    hymn: string;
  }>();

  const hymns = useHymns();
  const handleHymnViewUpdate = useUpdateHymnViews();

  const [currentHymn, setCurrentHymn] = React.useState(() => +params.hymn);
  const dimensions = Dimensions.get('window');

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: currentHymn.toString(),
          headerRight: () => <ToggleFavoriteButton id={currentHymn} />,
        }}
      />
      <View
        style={{
          height: dimensions.height - (HEADER_HEIGHT + AUDIO_HEIGHT),
        }}
      >
        <FlashList
          data={hymns}
          horizontal
          pagingEnabled
          onViewableItemsChanged={(items) => {
            items.viewableItems.forEach((v) => {
              handleHymnViewUpdate(v.item.id);
              setCurrentHymn(v.item.id);
            });
          }}
          renderItem={({ item }) => (
            <View
              style={{
                width: dimensions.width,
                height: '100%',
              }}
            >
              <HymnLyrics id={item.id} />
            </View>
          )}
          estimatedItemSize={dimensions.width}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          initialScrollIndex={hymns.findIndex((h) => h.id === +params.hymn)}
        />
      </View>
      {currentHymn <= 695 ? (
        <AudioPlayer id={currentHymn} />
      ) : (
        <AudioPlayerFallback />
      )}
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

const HymnLyrics = React.memo(function HymnLyrics({
  id,
}: {
  id: number;
}): React.ReactNode {
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
    <ScrollView className="flex-1 gap-4 bg-card p-4 pb-24">
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
});
