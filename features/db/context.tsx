import {
  QueryClient,
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { eq, InferSelectModel, sql } from 'drizzle-orm';
import * as React from 'react';

import { invariant } from '../utils';
import { initDatabase } from './config';
import * as schema from './schema';

export const DatabaseQueryOptions = queryOptions({
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
  database,
}: {
  children: React.ReactNode;
  database: Database;
}): React.ReactNode {
  const client = useQueryClient();

  const [options] = React.useState(() => makeOptions(client, database));

  return (
    <DatabaseContext.Provider value={database}>
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
    client.invalidateQueries(options.hymns);
  };
}

export function useToggleHymnFavorite(): (id: number) => Promise<void> {
  const db = useDb();
  const client = useQueryClient();
  const options = useDbOptions();
  return async (id) => {
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
  const hymns = useHymns();
  const hymn = hymns[id - 1];
  invariant(hymn, `Hymn with id ${id} not found`);
  return hymn;
}

export function useCategories(): Category[] {
  const options = useDbOptions();
  return useSuspenseQuery(options.categories).data;
}

export function useSettings(): Settings {
  const options = useDbOptions();
  return useSuspenseQuery(options.settings).data;
}
