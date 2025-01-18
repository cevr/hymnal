import { Icon } from '@roninoss/icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, ZoomOut } from 'react-native-reanimated';

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
  useHymns,
  useToggleHymnFavorite,
} from '~/features/db/context';
import { useColorScheme } from '~/lib/use-color-scheme';

export default function HymnsScreen(): React.ReactElement {
  const { colors } = useColorScheme();
  const searchBarRef = React.useRef<AdaptiveSearchBarRef>(null);
  const hymns = useHymns();
  const categories = useCategories();
  const [search_query, set_search_query] = useState<string>('');

  const [show_favorites, set_show_favorites] = useState<boolean>(false);

  const filtered_hymns: Hymn[] = hymns.filter((hymn) => {
    const matches_search: boolean =
      hymn.name.toLowerCase().includes(search_query.toLowerCase()) ||
      hymn.id.toString().includes(search_query);
    const matches_favorite: boolean = !show_favorites || hymn.favorite === 1;

    return matches_search && matches_favorite;
  });

  const category_map = categories.reduce((acc, category) => {
    console.log('category', category);
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
        subtitle: `#${hymn.id}`,
        hymn,
        onHymnFavoriteToggle: () => hymnFavoriteToggle(hymn.id),
      });
      category_map[hymn.category_id]++;

      return acc;
    },
    [] as (
      | {
          hymn: Hymn;
          id: number;
          title: string;
          subtitle: string;
          onHymnFavoriteToggle: () => void;
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
          >
            <Icon
              size={32}
              name={show_favorites ? 'heart' : 'heart-outline'}
              color={show_favorites ? '#EF4444' : '#6B7280'}
            />
          </Button>
        )}
        searchBar={{
          ref: searchBarRef,
          iosCancelButtonText: 'Cancel',
          onChangeText: (text) => {
            set_search_query(text);
          },
          materialRightView() {
            return (
              <Animated.View
                entering={FadeIn}
                exiting={ZoomOut}
              >
                <Button
                  variant="plain"
                  size="icon"
                >
                  <Icon
                    size={24}
                    name="cog-outline"
                    color={colors.foreground}
                  />
                </Button>
              </Animated.View>
            );
          },
          // content: (
          //   <KeyboardAwareScrollView
          //     className="ios:bg-background/95"
          //     contentContainerClassName="flex-1"
          //     keyboardShouldPersistTaps="always"
          //   >
          //     <View className="flex-1 items-center justify-center">
          //       <Text>Search bar content</Text>
          //     </View>
          //   </KeyboardAwareScrollView>
          // ),
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
    subtitle: string;
    onHymnFavoriteToggle: () => void;
  }>,
) {
  if (typeof info.item === 'string') {
    return <ListSectionHeader {...info} />;
  }
  return (
    <ListItem
      rightView={
        <Button
          variant="plain"
          size="icon"
          onPress={info.item.onHymnFavoriteToggle}
          className="pr-4"
        >
          <Icon
            size={32}
            name={info.item.hymn.favorite === 1 ? 'heart' : 'heart-outline'}
            color={info.item.hymn.favorite === 1 ? '#EF4444' : '#6B7280'}
          />
        </Button>
      }
      {...info}
      onPress={() => router.push(`/hymns/${info.item.hymn.id}`)}
    />
  );
}
