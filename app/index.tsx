import { Icon } from '@roninoss/icons';
import type { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { matchSorter } from 'match-sorter';
import * as React from 'react';
import { View } from 'react-native';

import { Button } from '~/components/nativewindui/button';
import {
  ESTIMATED_ITEM_HEIGHT,
  List,
  ListItem,
  ListSectionHeader,
} from '~/components/nativewindui/list';
import type { ListRenderItemInfo } from '~/components/nativewindui/list';
import { SearchInput } from '~/components/nativewindui/search-input';
import { Text } from '~/components/nativewindui/text';
import { useCategories, useHymns } from '~/features/db/context';
import type { Hymn } from '~/features/db/context';
import {
  ToggleFavoriteButton,
  ToggleFavoriteButtonFallback,
} from '~/features/hymns/toggle-favorite-button';
import { Reviewer } from '~/features/review';
import { useColorScheme } from '~/lib/use-color-scheme';

export default function HymnsScreen(): React.ReactElement {
  const { colors } = useColorScheme();
  const [showFavorites, setShowFavorites] = React.useState<boolean>(false);
  const [query, setQuery] = React.useState<string>('');
  const deferredQuery = React.useDeferredValue(query);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
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
          ),
        }}
      />
      <Reviewer />
      <View className="flex-1 gap-2">
        <View className="bg-background p-2 px-4">
          <SearchInput
            onChangeText={setQuery}
            autoComplete="off"
            textContentType="none"
          />
        </View>
        <HymnList
          query={deferredQuery}
          showFavorites={showFavorites}
        />
      </View>
    </>
  );
}

const HymnList = React.memo(function HymnList({
  query,
  showFavorites,
}: {
  query: string | null;
  showFavorites: boolean;
}) {
  const listRef = React.useRef<FlashList<any>>(null);
  const categories = useCategories();
  let hymns = useHymns();

  if (showFavorites) {
    hymns = hymns.filter((hymn) => hymn.favorite === 1);
  }

  if (query) {
    hymns = matchSorter(hymns, query, {
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

  const data = hymns.reduce((acc, hymn) => {
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
      data={data}
      estimatedItemSize={ESTIMATED_ITEM_HEIGHT.withSubTitle}
      renderItem={renderItem}
      ListEmptyComponent={() => {
        if (showFavorites && query) {
          return (
            <View className="flex-1 items-center justify-center">
              <Text className="text-lg">No favourites with this query</Text>
            </View>
          );
        }

        if (showFavorites) {
          return (
            <View className="flex-1 items-center justify-center">
              <Text className="text-lg">No favourites yet. Add some!</Text>
            </View>
          );
        }

        if (query) {
          return (
            <View className="flex-1 items-center justify-center">
              <Text className="text-lg">No hymns found</Text>
            </View>
          );
        }

        if (hymns.length === 0) {
          return (
            <View className="flex-1 items-center justify-center">
              <Text className="text-lg">
                Enter a search query to find hymns
              </Text>
            </View>
          );
        }
      }}
      keyExtractor={keyExtractor}
      drawDistance={400}
      ref={listRef}
    />
  );
});

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
      onPress={() => {
        router.push(`/hymns/${item.id}`);
      }}
    />
  );
}
