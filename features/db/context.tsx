import {
  QueryClient,
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { eq, InferSelectModel, sql } from 'drizzle-orm';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';
import * as React from 'react';
import { Platform } from 'react-native';

import { invariant } from '../utils';
import { initDatabase } from './config';
import * as schema from './schema';

const DatabaseOptions = queryOptions({
  queryKey: ['database'],
  queryFn: initDatabase,
  staleTime: Infinity,
});

type Database = Awaited<ReturnType<typeof initDatabase>>;
type DatabaseQueryOptions = ReturnType<typeof makeOptions>;

const DatabaseContext = React.createContext<Database | null>(null);
const DatabaseQueryOptionsContext =
  React.createContext<DatabaseQueryOptions | null>(null);

const makeOptions = (client: QueryClient, database: Database) => {
  const options = {
    hymns: queryOptions({
      queryKey: ['hymns'],
      queryFn: async () => await database.db.select().from(schema.hymns),
    }),
    hymn: (id: number) =>
      queryOptions({
        queryKey: ['hymn', id],
        queryFn: async () => {
          const res = await database.db
            .select()
            .from(schema.hymns)
            .where(eq(schema.hymns.id, id));
          return res[0];
        },
      }),

    categories: queryOptions({
      queryKey: ['categories'],
      queryFn: () => database.db.select().from(schema.categories),
    }),

    settings: queryOptions({
      queryKey: ['settings'],
      queryFn: async () => {
        const res = await database.db
          .select()
          .from(schema.settings)
          .where(eq(schema.settings.id, 1));
        return res[0];
      },
    }),
  };

  client.prefetchQuery(options.hymns);
  client.prefetchQuery(options.categories);
  client.prefetchQuery(options.settings);

  return options;
};

export function DatabaseProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const client = useQueryClient();
  const { data } = useSuspenseQuery(DatabaseOptions);

  const [options] = React.useState(() => makeOptions(client, data));

  return (
    <DatabaseContext.Provider value={data}>
      <DatabaseQueryOptionsContext.Provider value={options}>
        {children}
      </DatabaseQueryOptionsContext.Provider>
    </DatabaseContext.Provider>
  );
}

export type Hymn = InferSelectModel<typeof schema.hymns>;
export type Lyric = Hymn['verses'][0];
export type Category = InferSelectModel<typeof schema.categories>;
export type Settings = InferSelectModel<typeof schema.settings>;

function usePrepared(): Database['prepared'] {
  const db = React.useContext(DatabaseContext);
  invariant(db, '[use_prepared] must be used within a DatabaseProvider');
  return db.prepared;
}

export function useDb(): Database['db'] {
  const db = React.useContext(DatabaseContext);
  invariant(db, '[use_db] must be used within a DatabaseProvider');
  return db.db;
}

export function useDbOptions(): DatabaseQueryOptions {
  const client = React.useContext(DatabaseQueryOptionsContext);
  invariant(client, '[use_db_client] must be used within a DatabaseProvider');
  return client;
}

export function useUpdateHymnViews() {
  const db = useDb();
  const client = useQueryClient();
  const options = useDbOptions();
  return async (id: number) => {
    await db
      .update(schema.hymns)
      .set({ views: sql`${schema.hymns.views} + 1` })
      .where(eq(schema.hymns.id, id));
    client.invalidateQueries(options.hymn(id));
    client.invalidateQueries(options.hymns);
  };
}

export function useToggleHymnFavorite(): (id: number) => Promise<void> {
  const db = useDb();
  const client = useQueryClient();
  const options = useDbOptions();
  return async (id) => {
    client.setQueryData(options.hymn(id).queryKey, (old) => {
      if (!old) return old;
      return { ...old, favorite: old.favorite === 1 ? 0 : 1 };
    });
    client.setQueryData(options.hymns.queryKey, (old) => {
      if (!old) return old;
      return old.map((hymn) =>
        hymn.id === id
          ? { ...hymn, favorite: hymn.favorite === 1 ? 0 : 1 }
          : hymn,
      );
    });
    await db
      .update(schema.hymns)
      .set({
        favorite: sql`NOT ${schema.hymns.favorite}`,
      })
      .where(eq(schema.hymns.id, id));
    client.invalidateQueries(options.hymn(id));
    client.invalidateQueries(options.hymns);
  };
}

export function useUpdateSettings(): (
  new_settings: Partial<Settings>,
) => Promise<void> {
  const db = useDb();
  const client = useQueryClient();
  const options = useDbOptions();
  return async (new_settings) => {
    client.setQueryData(options.settings.queryKey, (old) => {
      if (!old) return old;
      return { ...old, ...new_settings };
    });
    await db
      .update(schema.settings)
      .set(new_settings)
      .where(eq(schema.settings.id, 1));
    client.invalidateQueries(options.settings);
  };
}

export function useHymns(): Hymn[] {
  const options = useDbOptions();
  return useSuspenseQuery(options.hymns).data;
}

export function useHymn(id: number): Hymn {
  const options = useDbOptions();
  return useSuspenseQuery(options.hymn(id)).data;
}

export function useCategories(): Category[] {
  const options = useDbOptions();
  return useSuspenseQuery(options.categories).data;
}

export function useSettings(): Settings {
  const options = useDbOptions();
  return useSuspenseQuery(options.settings).data;
}

export const AudioQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['audio', id],
    queryFn: async () => {
      const { sound } = await Audio.Sound.createAsync(
        { uri: `https://cvr-hymns.s3.amazonaws.com/${id}.mp3` },
        {},
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
