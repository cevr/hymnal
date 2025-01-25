import * as StoreReview from 'expo-store-review';
import * as React from 'react';

import { useGetTotalHymnViews } from './db/context';

export function Reviewer(): React.ReactNode {
  const getViews = useGetTotalHymnViews();

  React.useEffect(() => {
    async function showRequestReview() {
      const [can, views] = await Promise.all([
        StoreReview.hasAction(),
        getViews(),
      ]);
      try {
        if (can && views >= 50) {
          await StoreReview.requestReview();
        }
      } catch (error) {
        console.log(
          'FOR ANDROID: Make sure you meet all conditions to be able to test and use it: https://developer.android.com/guide/playcore/in-app-review/test#troubleshooting',
          error,
        );
      }
    }

    const timeout = setTimeout(() => {
      void showRequestReview();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [getViews]);

  return null;
}
