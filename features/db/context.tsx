import { eq, InferSelectModel, sql } from 'drizzle-orm';
import { cache, cacheResource } from 'pausa';
import * as React from 'react';

import { invariant } from '../utils';
import { initDatabase } from './config';
import * as schema from './schema';

type Database = Awaited<ReturnType<typeof initDatabase>>;
type DatabaseClient = ReturnType<typeof makeDbClient>;

const DatabaseContext = React.createContext<Database | null>(null);
const DatabaseClientContext = React.createContext<DatabaseClient | null>(null);

export function DatabaseProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const db = dbCache.use();
  const [client] = React.useState<ReturnType<typeof makeDbClient>>(() =>
    makeDbClient(db),
  );

  return (
    <DatabaseContext.Provider value={db}>
      <DatabaseClientContext.Provider value={client}>
        {children}
      </DatabaseClientContext.Provider>
    </DatabaseContext.Provider>
  );
}

const dbCache = cache(async () => await initDatabase());

const makeDbClient = ({ db, prepared }: Database) => {
  const client = cacheResource({
    hymns: async () => {
      return await db.select().from(schema.hymns);
    },
    hymn: async (_, id: number) => {
      const res = await db
        .select()
        .from(schema.hymns)
        .where(eq(schema.hymns.id, id));
      return res[0];
    },
    categories: async () => await db.select().from(schema.categories),
    settings: async () => {
      const res = await db
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.id, 1));
      return res[0];
    },
  });
  client.preload('hymns');
  client.preload('categories');
  client.preload('settings');
  return client;
};

export type Hymn = InferSelectModel<typeof schema.hymns>;
export type Category = InferSelectModel<typeof schema.categories>;
export type Settings = InferSelectModel<typeof schema.settings>;

function usePrepared(): Database['prepared'] {
  const db = React.useContext(DatabaseContext);
  invariant(db, '[use_prepared] must be used within a DatabaseProvider');
  return db.prepared;
}

function useDb(): Database['db'] {
  const db = React.useContext(DatabaseContext);
  invariant(db, '[use_db] must be used within a DatabaseProvider');
  return db.db;
}

function useDbClient(): ReturnType<typeof makeDbClient> {
  const client = React.useContext(DatabaseClientContext);
  invariant(client, '[use_db_client] must be used within a DatabaseProvider');
  return client;
}

export function useUpdateHymnViews() {
  const db = useDb();
  const client = useDbClient();
  return async (id: number) => {
    await db
      .update(schema.hymns)
      .set({ views: sql`${schema.hymns.views} + 1` })
      .where(eq(schema.hymns.id, id));
    client.invalidate('hymns');
    client.invalidate('hymn', id);
  };
}

export function useToggleHymnFavorite(): (id: number) => Promise<void> {
  const db = useDb();
  const client = useDbClient();
  return async (id) => {
    await db
      .update(schema.hymns)
      .set({
        favorite: sql`NOT ${schema.hymns.favorite}`,
      })
      .where(eq(schema.hymns.id, id));
    client.invalidate('hymns');
    client.invalidate('hymn', id);
  };
}

export function useUpdateSettings(): (
  new_settings: Partial<Settings>,
) => Promise<void> {
  const db = useDb();
  const client = useDbClient();
  return async (new_settings) => {
    await client.mutate(['settings'], async () => {
      await db
        .update(schema.settings)
        .set(new_settings)
        .where(eq(schema.settings.id, 1));
    });
  };
}

export function useHymns(): Hymn[] {
  const client = useDbClient();
  return client.use('hymns');
}

export function useHymn(id: number): Hymn {
  const client = useDbClient();
  const hymn = client.use('hymn', id);
  return hymn;
}

export function useCategories(): Category[] {
  const client = useDbClient();
  return client.use('categories');
}

export function useSettings(): Settings {
  const client = useDbClient();
  return client.use('settings');
}
