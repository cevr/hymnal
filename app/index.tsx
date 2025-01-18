import { Icon } from '@roninoss/icons';
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
import {
  Hymn,
  useCategories,
  useHymn,
  useHymns,
  useToggleHymnFavorite,
} from '~/features/db/context';
import { ToggleFavoriteButton } from '~/features/hymns/toggle-favorite-button';
import { useColorScheme } from '~/lib/use-color-scheme';

export default function HymnsScreen(): React.ReactElement {
  const { colors } = useColorScheme();
  const searchBarRef = React.useRef<AdaptiveSearchBarRef>(null);
  const hymns = useHymns();
  const categories = useCategories();
  const [show_favorites, set_show_favorites] = React.useState<boolean>(false);
  const [search_query, set_search_query] = React.useState<string>('');

  const deferredSearchQuery = React.useDeferredValue(search_query);

  const filtered_hymns = matchSorter(hymns, deferredSearchQuery, {
    keys: ['id', 'name', 'category', 'verses.text'],
  }).filter((hymn) => {
    return !show_favorites || hymn.favorite === 1;
  });

  const category_map = categories.reduce((acc, category) => {
    acc[category.id] = 0;
    return acc;
  }, [] as number[]);
  const hymnFavoriteToggle = useToggleHymnFavorite();

  const list_data = filtered_hymns.reduce(
    (acc, hymn) => {
      const categoryCount = category_map[hymn.category_id];
      if (categoryCount === 0) {
        acc.push(hymn.category);
      }
      acc.push({
        id: hymn.id,
        title: hymn.name,
        subTitle: `#${hymn.id}`,
        hymn,
        onHymnFavoriteToggle: () => hymnFavoriteToggle(hymn.id),
        activeColor: colors.primary,
        inactiveColor: colors.grey,
      });
      category_map[hymn.category_id]++;

      return acc;
    },
    [] as (
      | {
          hymn: Hymn;
          id: number;
          title: string;
          subTitle: string;
          onHymnFavoriteToggle: () => void;
          activeColor?: string;
          inactiveColor?: string;
        }
      | string
    )[],
  );

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
            onPress={() => set_show_favorites(!show_favorites)}
            hitSlop={20}
          >
            <Icon
              size={36}
              name={show_favorites ? 'heart' : 'heart-outline'}
              color={show_favorites ? colors.primary : colors.grey}
            />
          </Button>
        )}
        searchBar={{
          ref: searchBarRef,
          iosCancelButtonText: 'Cancel',
          onChangeText: (text) => {
            set_search_query(text);
          },
          onBlur: () => {
            searchBarRef.current?.cancelSearch();
          },
          placeholder: 'Search hymns...',
        }}
      />

      <List
        variant="insets"
        data={list_data as any}
        estimatedItemSize={ESTIMATED_ITEM_HEIGHT.withSubTitle}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
        keyExtractor={(item) =>
          typeof item === 'string' ? item : item.id.toString()
        }
      />
    </>
  );
}

function ListEmptyComponent() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg">No hymns found</Text>
    </View>
  );
}

function renderItem(
  info: ListRenderItemInfo<{
    hymn: Hymn;
    id: number;
    title: string;
    onHymnFavoriteToggle: () => void;
    activeColor?: string;
    inactiveColor?: string;
  }>,
) {
  if (typeof info.item === 'string') {
    return <ListSectionHeader {...info} />;
  }
  return (
    <ListItem
      rightView={<ToggleFavoriteButton id={info.item.id} />}
      {...info}
      onPress={() => router.push(`/hymns/${info.item.hymn.id}`)}
    />
  );
}
