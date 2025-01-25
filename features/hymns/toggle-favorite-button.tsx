import { Icon } from '@roninoss/icons';

import { Button } from '~/components/nativewindui/button';
import { useColorScheme } from '~/lib/use-color-scheme';

import { useHymn, useToggleHymnFavorite } from '../db/context';

export function ToggleFavoriteButton({ id }: { id: number }): React.ReactNode {
  const hymn = useHymn(id);
  const hymnFavoriteToggle = useToggleHymnFavorite();
  const { colors } = useColorScheme();
  return (
    <Button
      variant="plain"
      size="icon"
      onPress={() => hymnFavoriteToggle(id)}
      className="pr-4"
      hitSlop={10}
    >
      <Icon
        size={28}
        name={hymn.favorite === 1 ? 'heart' : 'heart-outline'}
        color={hymn.favorite === 1 ? colors.primary : colors.grey}
      />
    </Button>
  );
}

export function ToggleFavoriteButtonFallback(): React.ReactNode {
  return (
    <Button
      variant="plain"
      size="icon"
      className="pr-4"
      hitSlop={10}
    >
      <Icon
        size={28}
        name="heart-outline"
        color="gray"
      />
    </Button>
  );
}
