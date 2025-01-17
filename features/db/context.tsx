import { eq, InferSelectModel, sql } from 'drizzle-orm';
import { cache, cacheResource } from 'pausa';
import * as React from 'react';

import { invariant } from '../utils';
import { initDatabase } from './config';
import * as schema from './schema';

type Database = Awaited<ReturnType<typeof initDatabase>>;

const DatabaseContext = React.createContext<Awaited<
  ReturnType<typeof initDatabase>
> | null>(null);
const DatabaseClientContext = React.createContext<ReturnType<
  typeof makeDbClient
> | null>(null);

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

export const makeDbClient = ({ db, prepared }: Database) => {
  const client = cacheResource({
    hymns: async () => await prepared.get_all_hymns.execute(),
    hymn: async (_, id: number) => {
      const res = await prepared.get_hymn_by_id.execute({ id });
      return res[0];
    },
    categories: async () => await prepared.get_all_categories.execute(),
    settings: async () => {
      const res = await prepared.get_settings.execute();
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

function use_db(): Database['db'] {
  const db = React.useContext(DatabaseContext);
  invariant(db, '[use_db] must be used within a DatabaseProvider');
  return db.db;
}

function use_prepared(): Database['prepared'] {
  const db = React.useContext(DatabaseContext);
  invariant(db, '[use_prepared] must be used within a DatabaseProvider');
  return db.prepared;
}

function use_db_client(): ReturnType<typeof makeDbClient> {
  const client = React.useContext(DatabaseClientContext);
  invariant(client, '[use_db_client] must be used within a DatabaseProvider');
  return client;
}

export function use_update_hymn_views() {
  const prepared = use_prepared();
  const client = use_db_client();
  return async (id: number) => {
    await client.mutate(['hymn', id], async () => {
      await prepared.update_hymn_views.execute({ id });
    });
  };
}

export function use_toggle_hymn_favorite(): (id: number) => Promise<void> {
  const prepared = use_prepared();
  const client = use_db_client();
  return async (id) => {
    await client.mutate(['hymn', id], async () => {
      await prepared.toggle_hymn_favorite.execute({ id });
    });
  };
}

export function use_update_settings(): (
  new_settings: Partial<Settings>,
) => Promise<void> {
  const prepared = use_prepared();
  const client = use_db_client();
  return async (new_settings) => {
    await client.mutate(['settings'], async () => {
      await prepared.update_settings.execute(new_settings);
    });
  };
}

export function use_hymns(): Hymn[] {
  const client = use_db_client();
  return client.use('hymns');
}

export function use_hymn(id: number): Hymn {
  const client = use_db_client();
  const hymn = client.use('hymn', id);
  return hymn;
}

export function use_categories(): Category[] {
  const client = use_db_client();
  return client.use('categories');
}

export function use_settings(): Settings {
  const client = use_db_client();
  return client.use('settings');
}
