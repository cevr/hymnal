import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { eq, like } from 'drizzle-orm';
import React, { useState } from 'react';
import { FlatList, TextInput, TouchableOpacity, View } from 'react-native';

import HymnListItem from '../components/HymnListItem';
import { getDatabase, hymns } from '../db';
import { RootStackParamList } from './root-stack';

type OverviewScreenNavigationProps = StackNavigationProp<
  RootStackParamList,
  'Hymns'
>;

export default function HymnList() {
  const navigation = useNavigation<OverviewScreenNavigationProps>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<
    'normal' | 'views' | 'alphabetical'
  >('normal');

  const { data: hymnList = [] } = useQuery({
    queryKey: ['hymns', searchQuery, sortOrder],
    queryFn: async () => {
      const db = getDatabase();
      let query = db.select().from(hymns);

      if (searchQuery) {
        query = query.where(like(hymns.name, `%${searchQuery}%`));
      }

      if (sortOrder === 'alphabetical') {
        query = query.orderBy(hymns.name);
      } else if (sortOrder === 'views') {
        query = query.orderBy(hymns.views, 'desc');
      } else {
        query = query.orderBy(hymns.id);
      }

      return await query;
    },
  });

  const toggleSortOrder = () => {
    const orders: ('normal' | 'views' | 'alphabetical')[] = [
      'normal',
      'views',
      'alphabetical',
    ];
    const currentIndex = orders.indexOf(sortOrder);
    const nextOrder = orders[(currentIndex + 1) % orders.length];
    setSortOrder(nextOrder);
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row bg-gray-100 p-4">
        <TextInput
          className="h-10 flex-1 rounded-md border border-gray-300 bg-white px-3"
          placeholder="Search hymns..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          className="ml-2 justify-center"
          onPress={toggleSortOrder}
        >
          <Ionicons
            name="ios-funnel"
            size={24}
            color="#333"
          />
        </TouchableOpacity>
      </View>
      <FlatList
        data={hymnList}
        renderItem={({ item }) => (
          <HymnListItem
            hymn={item}
            onPress={() => navigation.navigate('Hymn', { id: item.id })}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}
