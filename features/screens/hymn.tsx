import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Settings } from '../components/Settings';
import { getDatabase, hymns, settings } from '../db';

export default function Hymn({ route, navigation }) {
  const { hymnId } = route.params;
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const queryClient = useQueryClient();
  const drawerAnimation = useRef(new Animated.Value(0)).current;

  const { data: hymn } = useQuery({
    queryKey: ['hymn', hymnId],
    queryFn: async () => {
      const db = getDatabase();
      const result = await db.select().from(hymns).where(eq(hymns.id, hymnId));
      return result[0];
    },
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const db = getDatabase();
      const result = await db.select().from(settings).where(eq(settings.id, 1));
      return result[0];
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const db = getDatabase();
      await db
        .update(hymns)
        .set({ favorite: hymn.favorite ? 0 : 1 })
        .where(eq(hymns.id, hymnId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hymn', hymnId] });
      queryClient.invalidateQueries({ queryKey: ['hymns'] });
    },
  });

  const incrementViewsMutation = useMutation({
    mutationFn: async () => {
      const db = getDatabase();
      await db
        .update(hymns)
        .set({ views: hymn.views + 1 })
        .where(eq(hymns.id, hymnId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hymn', hymnId] });
      queryClient.invalidateQueries({ queryKey: ['hymns'] });
    },
  });

  useEffect(() => {
    incrementViewsMutation.mutate();
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowSettings(true)}
          className="mr-4"
        >
          <Ionicons
            name="ios-settings-outline"
            size={24}
            color="#333"
          />
        </TouchableOpacity>
      ),
    });
  }, []);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    Animated.timing(drawerAnimation, {
      toValue: showSettings ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showSettings]);

  async function loadSound() {
    const { sound: newSound } = await Audio.Sound.createAsync(
      // Replace with actual audio URL
      { uri: 'https://example.com/hymn.mp3' },
      { shouldPlay: false },
    );
    setSound(newSound);
    const status = await newSound.getStatusAsync();
    setDuration(status.durationMillis);
  }

  async function playSound() {
    if (!sound) {
      await loadSound();
    }
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
    setIsPlaying(!isPlaying);
  }

  async function scrubSound(value) {
    if (sound) {
      await sound.setPositionAsync(value);
      setPosition(value);
    }
  }

  if (!hymn || !settingsData) {
    return <Text className="p-4">Loading...</Text>;
  }

  const drawerStyle = {
    transform: [
      {
        translateX: drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0],
        }),
      },
    ],
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="mb-16 p-4">
        <Text
          className="mb-4 text-2xl font-bold"
          style={{
            fontSize: settingsData.fontSize,
            lineHeight: settingsData.fontSize * settingsData.lineHeight,
            fontFamily: settingsData.fontFamily,
          }}
        >
          {hymn.name}
        </Text>
        {hymn.verses.map((verse, index) => (
          <View
            key={verse.id}
            className="mb-4"
          >
            <Text
              className="mb-2 text-lg font-semibold"
              style={{
                fontSize: settingsData.fontSize - 2,
                lineHeight:
                  (settingsData.fontSize - 2) * settingsData.lineHeight,
                fontFamily: settingsData.fontFamily,
              }}
            >
              Verse {index + 1}
            </Text>
            <Text
              className="text-base"
              style={{
                fontSize: settingsData.fontSize,
                lineHeight: settingsData.fontSize * settingsData.lineHeight,
                fontFamily: settingsData.fontFamily,
              }}
            >
              {verse.text}
            </Text>
          </View>
        ))}
      </ScrollView>
      <Animated.View
        className="absolute bottom-0 right-0 top-0 w-3/4 bg-white shadow-lg"
        style={drawerStyle}
      >
        <Settings onClose={() => setShowSettings(false)} />
      </Animated.View>
      <View className="absolute bottom-0 left-0 right-0 flex-row items-center bg-gray-100 p-2">
        <TouchableOpacity
          onPress={playSound}
          className="mr-2"
        >
          <Ionicons
            name={isPlaying ? 'ios-pause' : 'ios-play'}
            size={24}
            color="#333"
          />
        </TouchableOpacity>
        <Slider
          style={{ flex: 1 }}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onValueChange={scrubSound}
        />
        <TouchableOpacity
          onPress={() => toggleFavoriteMutation.mutate()}
          className="ml-2"
        >
          <Ionicons
            name={hymn.favorite ? 'heart' : 'heart-outline'}
            size={24}
            color={hymn.favorite ? '#ff6b6b' : '#333'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
