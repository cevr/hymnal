import {
  Hymn,
  use_categories,
  use_hymns,
  use_toggle_hymn_favorite,
} from '@/features/db/context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Heart, Search, SortAsc } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { RootStackParamList } from './root-stack';

type HymnsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Hymns'
>;

type HymnsScreenProps = {
  navigation: HymnsScreenNavigationProp;
};

export function HymnsScreen({
  navigation,
}: HymnsScreenProps): React.ReactElement {
  const hymns = use_hymns();
  const categories = use_categories();
  const handle_favorite_toggle = use_toggle_hymn_favorite();
  const [search_query, set_search_query] = useState<string>('');
  const [selected_category, set_selected_category] = useState<string>('All');
  const [order_by, set_order_by] = useState<'number' | 'name' | 'views'>(
    'number',
  );
  const [show_favorites, set_show_favorites] = useState<boolean>(false);

  const filtered_hymns: Hymn[] = hymns.filter((hymn) => {
    const matches_search: boolean =
      hymn.name.toLowerCase().includes(search_query.toLowerCase()) ||
      hymn.id.toString().includes(search_query);
    const matches_category: boolean =
      selected_category === 'All' ||
      categories.find((c) => c.id === hymn.category_id)?.name ===
        selected_category;
    const matches_favorite: boolean = !show_favorites || hymn.favorite === 1;

    return matches_search && matches_category && matches_favorite;
  });

  const sorted_hymns: Hymn[] = filtered_hymns.sort((a, b) => {
    if (order_by === 'number') return a.id - b.id;
    if (order_by === 'name') return a.name.localeCompare(b.name);
    return b.views - a.views;
  });

  return (
    <View className="flex-1 bg-white">
      <View className="sticky top-0 z-10 bg-white">
        <SearchBar
          value={search_query}
          on_change_text={set_search_query}
          on_order_change={set_order_by}
          on_favorites_toggle={() => set_show_favorites(!show_favorites)}
          show_favorites={show_favorites}
          order_by={order_by}
          categories={['All', ...categories.map((c) => c.name)]}
          selected_category={selected_category}
          on_category_change={set_selected_category}
        />
      </View>
      <FlatList
        data={sorted_hymns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <HymnListItem
            hymn={item}
            on_press={() => navigation.navigate('Hymn', { id: item.id })}
            on_favorite_toggle={() => handle_favorite_toggle(item.id)}
          />
        )}
      />
    </View>
  );
}

type SearchBarProps = {
  value: string;
  on_change_text: (text: string) => void;
  on_order_change: (order: 'number' | 'name' | 'views') => void;
  on_favorites_toggle: () => void;
  show_favorites: boolean;
  order_by: 'number' | 'name' | 'views';
  categories: string[];
  selected_category: string;
  on_category_change: (category: string) => void;
};

export function SearchBar({
  value,
  on_change_text,
  on_order_change,
  on_favorites_toggle,
  show_favorites,
  order_by,
  categories,
  selected_category,
  on_category_change,
}: SearchBarProps): React.ReactElement {
  return (
    <View className="gap-2 p-4">
      <View className="flex-row items-center rounded-full bg-gray-100 px-4 py-2">
        <Search
          size={20}
          color="#6B7280"
        />
        <TextInput
          className="ml-2 flex-1 text-base"
          placeholder="Search hymns..."
          value={value}
          onChangeText={on_change_text}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row"
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => on_category_change(category)}
            className={`mr-2 rounded-full px-3 py-1 ${
              category === selected_category ? 'bg-black' : 'bg-gray-200'
            }`}
          >
            <Text
              className={`${
                category === selected_category ? 'text-white' : 'text-black'
              }`}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View className="flex-row justify-between">
        <TouchableOpacity
          onPress={() =>
            on_order_change(
              order_by === 'number'
                ? 'name'
                : order_by === 'name'
                  ? 'views'
                  : 'number',
            )
          }
          className="flex-row items-center"
        >
          <SortAsc
            size={20}
            color="#6B7280"
          />
          <Text className="ml-2 text-gray-600">
            {order_by === 'number'
              ? 'Number'
              : order_by === 'name'
                ? 'Name'
                : 'Views'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={on_favorites_toggle}
          className="flex-row items-center"
        >
          <Heart
            size={20}
            color={show_favorites ? '#EF4444' : '#6B7280'}
            fill={show_favorites ? '#EF4444' : 'none'}
          />
          <Text className="ml-2 text-gray-600">Favorites</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

type HymnListItemProps = {
  hymn: Hymn;
  on_press: () => void;
  on_favorite_toggle: () => void;
};

export function HymnListItem({
  hymn,
  on_press,
  on_favorite_toggle,
}: HymnListItemProps): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={on_press}
      className="flex-row items-center justify-between border-b border-gray-200 p-4"
    >
      <View className="flex-1">
        <Text className="text-lg font-semibold">{hymn.name}</Text>
        <Text className="text-sm text-gray-600">#{hymn.id}</Text>
      </View>
      <TouchableOpacity
        onPress={on_favorite_toggle}
        className="p-2"
      >
        <Heart
          size={24}
          color={hymn.favorite === 1 ? '#EF4444' : '#6B7280'}
          fill={hymn.favorite === 1 ? '#EF4444' : 'none'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
