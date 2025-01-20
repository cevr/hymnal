import { Icon } from '@roninoss/icons';
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { matchSorter } from 'match-sorter';
import * as React from 'react';
import { View } from 'react-native';

import { AdaptiveSearchHeader } from '~/components/nativewindui/adaptive-search-header';
import { AdaptiveSearchBarRef } from '~/components/nativewindui/adaptive-search-header/types';
import { Button } from '~/components/nativewindui/button';
import {
  ESTIMATED_ITEM_HEIGHT,
  List,
  ListItem,
  ListRenderItemInfo,
  ListSectionHeader,
} from '~/components/nativewindui/list';
import { Text } from '~/components/nativewindui/text';
import { AudioQueryOptions } from '~/features/audio';
import {
  Hymn,
  useCategories,
  useDbOptions,
  useHymns,
} from '~/features/db/context';
import {
  ToggleFavoriteButton,
  ToggleFavoriteButtonFallback,
} from '~/features/hymns/toggle-favorite-button';
import { useColorScheme } from '~/lib/use-color-scheme';

export default function HymnsScreen(): React.ReactElement {
  const { colors } = useColorScheme();
  const searchBarRef = React.useRef<AdaptiveSearchBarRef>(null);
  const [showFavorites, setShowFavorites] = React.useState<boolean>(false);
  const [query, setQuery] = React.useState<string>('');
  const deferredQuery = React.useDeferredValue(query);

  return (
    <>
      <AdaptiveSearchHeader
        iosTitle="Hymns"
        iosIsLargeTitle={false}
        shadowVisible={false}
        rightView={() => (
          <Button
            variant="plain"
            size="icon"
            onPress={() => setShowFavorites(!showFavorites)}
            hitSlop={20}
          >
            <Icon
              size={28}
              name={showFavorites ? 'heart' : 'heart-outline'}
              color={showFavorites ? colors.primary : colors.grey}
            />
          </Button>
        )}
        searchBar={{
          ref: searchBarRef,
          iosCancelButtonText: 'Cancel',
          onChangeText: (text) => {
            setQuery(text);
          },
          onBlur: () => {
            searchBarRef.current?.cancelSearch();
          },
          placeholder: 'Search hymns...',
        }}
      />
      <HymnList
        query={deferredQuery}
        showFavorites={showFavorites}
      />
    </>
  );
}

function HymnList({
  query,
  showFavorites,
}: {
  query: string;
  showFavorites: boolean;
}) {
  const listRef = React.useRef<FlashList<any>>(null);
  const client = useQueryClient();
  const options = useDbOptions();

  const categories = useCategories();
  const hymns = useHymns();

  let filteredHymns = hymns;

  if (showFavorites) {
    filteredHymns = filteredHymns.filter((hymn) => hymn.favorite === 1);
  }

  if (query) {
    filteredHymns = matchSorter(filteredHymns, query, {
      keys: ['id', 'name'],
    });
  }

  const categoryMap = categories.reduce((acc, category) => {
    acc[category.id] = 0;
    return acc;
  }, [] as number[]);

  React.useEffect(() => {
    if (query) {
      listRef.current?.scrollToOffset({ offset: 0 });
    }
  }, [query]);

  const listData = filteredHymns.reduce((acc, hymn) => {
    const categoryCount = categoryMap[hymn.category_id];
    if (categoryCount === 0) {
      acc.push(hymn.category);
    }
    acc.push({
      id: hymn.id,
      title: hymn.name,
      subTitle: `#${hymn.id}`,
      hymn,
    });
    categoryMap[hymn.category_id]++;

    return acc;
  }, [] as ListItem[]);

  return (
    <List
      variant="insets"
      data={listData}
      estimatedItemSize={ESTIMATED_ITEM_HEIGHT.withSubTitle}
      renderItem={renderItem}
      ListEmptyComponent={ListEmptyComponent}
      keyExtractor={keyExtractor}
      onViewableItemsChanged={({ viewableItems }) => {
        viewableItems.forEach(({ item }) => {
          if (typeof item !== 'string') {
            client.prefetchQuery(options.hymn(item.id));
            client.prefetchQuery(AudioQueryOptions(item.id));
          }
        });
      }}
      drawDistance={400}
      ref={listRef}
    />
  );
}

type ListItem =
  | {
      hymn: Hymn;
      id: number;
      title: string;
      subTitle: string;
    }
  | string;

function keyExtractor(item: { id: number } | string) {
  return typeof item === 'string' ? item : item.id.toString();
}

function ListEmptyComponent() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg">No hymns found</Text>
    </View>
  );
}

function renderItem(info: ListRenderItemInfo<ListItem>) {
  const item = info.item;
  if (typeof item === 'string') {
    return <ListSectionHeader {...info} />;
  }
  return (
    <ListItem
      rightView={
        <React.Suspense fallback={<ToggleFavoriteButtonFallback />}>
          <ToggleFavoriteButton id={item.id} />
        </React.Suspense>
      }
      {...info}
      onPress={() => router.push(`/hymns/${item.id}`)}
    />
  );
}
