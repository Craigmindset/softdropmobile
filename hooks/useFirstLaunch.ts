import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const HAS_LAUNCHED = 'has_launched';

export function useFirstLaunch() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const hasLaunched = await AsyncStorage.getItem(HAS_LAUNCHED);
        if (hasLaunched === null) {
          await AsyncStorage.setItem(HAS_LAUNCHED, 'true');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        // If there's an error reading/writing storage, default to false
        setIsFirstLaunch(false);
      }
    }

    checkFirstLaunch();
  }, []);

  return isFirstLaunch;
}
