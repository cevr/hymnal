import { useSuspenseQueries } from '@tanstack/react-query';

import { AudioSetupQueryOptions } from './audio';
import { DatabaseQueryOptions, DatabaseProvider } from './db/context';

export function RootProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const [database] = useSuspenseQueries({
    queries: [DatabaseQueryOptions, AudioSetupQueryOptions],
  });
  return (
    <DatabaseProvider database={database.data}>{children}</DatabaseProvider>
  );
}
