import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  RewardedInterstitialAd,
  AppOpenAd,
  AdsConsent,
  AdsConsentStatus,
} from 'react-native-google-mobile-ads';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// AD UNIT IDs - Replace with your actual ad unit IDs
// ============================================================================
export const AD_UNIT_IDS = {
  // Test IDs - Replace with production IDs before release
  BANNER: __DEV__ ? 'ca-app-pub-3940256099942544/6300978111' : 'YOUR_BANNER_AD_UNIT_ID',
  INTERSTITIAL: __DEV__ ? 'ca-app-pub-3940256099942544/1033173712' : 'YOUR_INTERSTITIAL_AD_UNIT_ID',
  REWARDED: __DEV__ ? 'ca-app-pub-3940256099942544/5224354917' : 'YOUR_REWARDED_AD_UNIT_ID',
  REWARDED_INTERSTITIAL: __DEV__ ? 'ca-app-pub-3940256099942544/5354046379' : 'YOUR_REWARDED_INTERSTITIAL_AD_UNIT_ID',
  APP_OPEN: __DEV__ ? 'ca-app-pub-3940256099942544/9257395921' : 'YOUR_APP_OPEN_AD_UNIT_ID',
  NATIVE: __DEV__ ? 'ca-app-pub-3940256099942544/2247696110' : 'YOUR_NATIVE_AD_UNIT_ID',
};

// ============================================================================
// TYPES
// ============================================================================
export interface BannerAdProps {
  size?: BannerAdSize;
  unitId?: string;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: Error) => void;
  onAdOpened?: () => void;
  onAdClosed?: () => void;
}

export interface NativeAdProps {
  unitId?: string;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: Error) => void;
}

export interface FullScreenAdCallbacks {
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: Error) => void;
  onAdShowed?: () => void;
  onAdDismissed?: () => void;
  onAdFailedToShow?: (error: Error) => void;
  onEarnedReward?: (reward: { type: string; amount: number }) => void;
}

// ============================================================================
// CONSENT MANAGEMENT
// ============================================================================
export const requestConsentInfoUpdate = async (): Promise<boolean> => {
  try {
    const consentInfo = await AdsConsent.requestInfoUpdate();
    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdsConsentStatus.REQUIRED
    ) {
      const { status } = await AdsConsent.showForm();
      return status === AdsConsentStatus.OBTAINED;
    }
    return consentInfo.status === AdsConsentStatus.OBTAINED ||
      consentInfo.status === AdsConsentStatus.NOT_REQUIRED;
  } catch (error) {
    console.error('Consent update error:', error);
    return true; // Allow ads to continue
  }
};

export const getConsentStatus = async (): Promise<AdsConsentStatus> => {
  try {
    const consentInfo = await AdsConsent.requestInfoUpdate();
    return consentInfo.status;
  } catch (error) {
    console.error('Get consent status error:', error);
    return AdsConsentStatus.OBTAINED;
  }
};

// ============================================================================
// 1. BANNER AD COMPONENT
// ============================================================================
export const BannerAdComponent: React.FC<BannerAdProps> = ({
  size = BannerAdSize.BANNER,
  unitId = AD_UNIT_IDS.BANNER,
  onAdLoaded,
  onAdFailedToLoad,
  onAdOpened,
  onAdClosed,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <View style={styles.bannerContainer}>
      {isLoading && !hasError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6366F1" />
        </View>
      )}
      <BannerAd
        unitId={unitId}
        size={size}
        onAdLoaded={() => {
          setIsLoading(false);
          setHasError(false);
          onAdLoaded?.();
        }}
        onAdFailedToLoad={(error) => {
          setIsLoading(false);
          setHasError(true);
          onAdFailedToLoad?.(error);
        }}
        onAdOpened={onAdOpened}
        onAdClosed={onAdClosed}
      />
    </View>
  );
};

// ============================================================================
// 2. NATIVE AD COMPONENT (Simplified - Uses Banner as placeholder)
// ============================================================================
export const NativeAdComponent: React.FC<NativeAdProps> = ({
  unitId = AD_UNIT_IDS.NATIVE,
  onAdLoaded,
  onAdFailedToLoad,
}) => {
  // For now, using a medium rectangle banner as native ad placeholder
  // In production, you'd use react-native-google-mobile-ads native ad API
  return (
    <View style={styles.nativeContainer}>
      <BannerAdComponent
        size={BannerAdSize.MEDIUM_RECTANGLE}
        unitId={unitId}
        onAdLoaded={onAdLoaded}
        onAdFailedToLoad={onAdFailedToLoad}
      />
    </View>
  );
};

// ============================================================================
// 3. INTERSTITIAL AD HOOK (Simplified & Reliable)
// ============================================================================
export const useInterstitialAd = (callbacks?: FullScreenAdCallbacks) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const interstitialAdRef = useRef<InterstitialAd | null>(null);
  const callbacksRef = useRef(callbacks);

  // Keep callbacks ref up to date
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Load ad
  const loadAd = useCallback(() => {
    // Don't create new ad if one is already loaded
    if (interstitialAdRef.current && isLoaded) {
      return;
    }

    // Clean up old ad instance
    if (interstitialAdRef.current) {
      interstitialAdRef.current = null;
    }

    // Create new ad instance
    const interstitialAd = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL);
    interstitialAdRef.current = interstitialAd;

    const unsubscribeLoaded = interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log('Interstitial ad loaded');
        setIsLoaded(true);
        callbacksRef.current?.onAdLoaded?.();
      }
    );

    const unsubscribeError = interstitialAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('Interstitial ad failed to load:', error);
        setIsLoaded(false);
        callbacksRef.current?.onAdFailedToLoad?.(error);
      }
    );

    const unsubscribeOpened = interstitialAd.addAdEventListener(
      AdEventType.OPENED,
      () => {
        console.log('Interstitial ad opened');
        callbacksRef.current?.onAdShowed?.();
      }
    );

    const unsubscribeClosed = interstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('Interstitial ad closed');
        setIsLoaded(false);
        callbacksRef.current?.onAdDismissed?.();

        // Clean up and preload next ad
        unsubscribeLoaded();
        unsubscribeError();
        unsubscribeOpened();
        unsubscribeClosed();

        // Preload next ad after a delay
        setTimeout(() => {
          loadAd();
        }, 1000);
      }
    );

    // Load the ad
    interstitialAd.load();
  }, [isLoaded]);

  // Show ad
  const showAd = useCallback(() => {
    const ad = interstitialAdRef.current;
    if (ad && isLoaded) {
      try {
        console.log('Showing interstitial ad');
        ad.show();
        setIsLoaded(false);
      } catch (error) {
        console.warn('Failed to show interstitial ad:', error);
        setIsLoaded(false);
        callbacksRef.current?.onAdFailedToShow?.(error as Error);
      }
    } else {
      console.warn('Interstitial ad not ready - isLoaded:', isLoaded, 'ad exists:', !!ad);
      callbacksRef.current?.onAdFailedToShow?.(new Error('Ad not ready'));
    }
  }, [isLoaded]);

  // Initial load
  useEffect(() => {
    loadAd();
  }, [loadAd]);

  return { isLoaded, loadAd, showAd };
};

// Keep export for backward compatibility (but not used internally)
export class InterstitialAdManager {
  static getInstance() {
    return {
      isReady: () => false,
      load: () => { },
      show: () => { },
    };
  }
}

// ============================================================================
// 4. REWARDED AD MANAGER
// ============================================================================
class RewardedAdManager {
  private static instance: RewardedAdManager;
  private rewardedAd: RewardedAd | null = null;
  private isLoaded = false;
  private callbacks: FullScreenAdCallbacks = {};

  static getInstance(): RewardedAdManager {
    if (!RewardedAdManager.instance) {
      RewardedAdManager.instance = new RewardedAdManager();
    }
    return RewardedAdManager.instance;
  }

  load(unitId: string = AD_UNIT_IDS.REWARDED, callbacks?: FullScreenAdCallbacks) {
    if (this.isLoaded) return;

    this.callbacks = callbacks || {};
    this.rewardedAd = RewardedAd.createForAdRequest(unitId);

    const unsubscribeLoaded = this.rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        this.isLoaded = true;
        this.callbacks.onAdLoaded?.();
      }
    );

    const subscribeEarned = this.rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        this.callbacks.onEarnedReward?.(reward);
      }
    );

    const unsubscribeError = this.rewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        this.isLoaded = false;
        this.callbacks.onAdFailedToLoad?.(error);
      }
    );

    const unsubscribeDismissed = this.rewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        this.isLoaded = false;
        this.callbacks.onAdDismissed?.();
        // Preload next ad
        this.load(unitId, this.callbacks);
      }
    );

    this.rewardedAd.load();

    return () => {
      unsubscribeLoaded();
      subscribeEarned();
      unsubscribeError();
      unsubscribeDismissed();
    };
  }

  show() {
    if (this.rewardedAd && this.isLoaded) {
      this.rewardedAd.show();
    } else {
      console.warn('Rewarded ad not loaded yet');
      this.callbacks.onAdFailedToShow?.(new Error('Ad not loaded'));
    }
  }

  isReady() {
    return this.isLoaded;
  }
}

export const useRewardedAd = (callbacks?: FullScreenAdCallbacks) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [earnedReward, setEarnedReward] = useState<{ type: string; amount: number } | null>(null);
  const manager = RewardedAdManager.getInstance();

  const loadAd = useCallback(() => {
    manager.load(AD_UNIT_IDS.REWARDED, {
      ...callbacks,
      onAdLoaded: () => {
        setIsLoaded(true);
        callbacks?.onAdLoaded?.();
      },
      onAdDismissed: () => {
        setIsLoaded(false);
        callbacks?.onAdDismissed?.();
      },
      onEarnedReward: (reward) => {
        setEarnedReward(reward);
        callbacks?.onEarnedReward?.(reward);
      },
    });
  }, [callbacks, manager]);

  const showAd = useCallback(() => {
    if (isLoaded) {
      manager.show();
      setIsLoaded(false);
    }
  }, [isLoaded, manager]);

  useEffect(() => {
    loadAd();
  }, [loadAd]);

  return { isLoaded, loadAd, showAd, earnedReward, setEarnedReward };
};

// ============================================================================
// 5. REWARDED INTERSTITIAL AD MANAGER
// ============================================================================
class RewardedInterstitialAdManager {
  private static instance: RewardedInterstitialAdManager;
  private rewardedInterstitialAd: RewardedInterstitialAd | null = null;
  private isLoaded = false;
  private callbacks: FullScreenAdCallbacks = {};

  static getInstance(): RewardedInterstitialAdManager {
    if (!RewardedInterstitialAdManager.instance) {
      RewardedInterstitialAdManager.instance = new RewardedInterstitialAdManager();
    }
    return RewardedInterstitialAdManager.instance;
  }

  load(unitId: string = AD_UNIT_IDS.REWARDED_INTERSTITIAL, callbacks?: FullScreenAdCallbacks) {
    if (this.isLoaded) return;

    this.callbacks = callbacks || {};
    this.rewardedInterstitialAd = RewardedInterstitialAd.createForAdRequest(unitId);

    const unsubscribeLoaded = this.rewardedInterstitialAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        this.isLoaded = true;
        this.callbacks.onAdLoaded?.();
      }
    );

    const subscribeEarned = this.rewardedInterstitialAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        this.callbacks.onEarnedReward?.(reward);
      }
    );

    const unsubscribeError = this.rewardedInterstitialAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        this.isLoaded = false;
        this.callbacks.onAdFailedToLoad?.(error);
      }
    );

    const unsubscribeDismissed = this.rewardedInterstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        this.isLoaded = false;
        this.callbacks.onAdDismissed?.();
        this.load(unitId, this.callbacks);
      }
    );

    this.rewardedInterstitialAd.load();

    return () => {
      unsubscribeLoaded();
      subscribeEarned();
      unsubscribeError();
      unsubscribeDismissed();
    };
  }

  show() {
    if (this.rewardedInterstitialAd && this.isLoaded) {
      this.rewardedInterstitialAd.show();
    } else {
      console.warn('Rewarded interstitial ad not loaded yet');
      this.callbacks.onAdFailedToShow?.(new Error('Ad not loaded'));
    }
  }

  isReady() {
    return this.isLoaded;
  }
}

export const useRewardedInterstitialAd = (callbacks?: FullScreenAdCallbacks) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [earnedReward, setEarnedReward] = useState<{ type: string; amount: number } | null>(null);
  const manager = RewardedInterstitialAdManager.getInstance();

  const loadAd = useCallback(() => {
    manager.load(AD_UNIT_IDS.REWARDED_INTERSTITIAL, {
      ...callbacks,
      onAdLoaded: () => {
        setIsLoaded(true);
        callbacks?.onAdLoaded?.();
      },
      onAdDismissed: () => {
        setIsLoaded(false);
        callbacks?.onAdDismissed?.();
      },
      onEarnedReward: (reward) => {
        setEarnedReward(reward);
        callbacks?.onEarnedReward?.(reward);
      },
    });
  }, [callbacks, manager]);

  const showAd = useCallback(() => {
    if (isLoaded) {
      manager.show();
      setIsLoaded(false);
    }
  }, [isLoaded, manager]);

  useEffect(() => {
    loadAd();
  }, [loadAd]);

  return { isLoaded, loadAd, showAd, earnedReward, setEarnedReward };
};

// ============================================================================
// 6. APP OPEN AD MANAGER
// ============================================================================
class AppOpenAdManager {
  private static instance: AppOpenAdManager;
  private appOpenAd: AppOpenAd | null = null;
  private isLoaded = false;
  private callbacks: FullScreenAdCallbacks = {};

  static getInstance(): AppOpenAdManager {
    if (!AppOpenAdManager.instance) {
      AppOpenAdManager.instance = new AppOpenAdManager();
    }
    return AppOpenAdManager.instance;
  }

  load(unitId: string = AD_UNIT_IDS.APP_OPEN, callbacks?: FullScreenAdCallbacks) {
    if (this.isLoaded) return;

    this.callbacks = callbacks || {};
    this.appOpenAd = AppOpenAd.createForAdRequest(unitId);

    const unsubscribeLoaded = this.appOpenAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        this.isLoaded = true;
        this.callbacks.onAdLoaded?.();
      }
    );

    const unsubscribeError = this.appOpenAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        this.isLoaded = false;
        this.callbacks.onAdFailedToLoad?.(error);
      }
    );

    const unsubscribeShowed = this.appOpenAd.addAdEventListener(
      AdEventType.OPENED,
      () => {
        this.callbacks.onAdShowed?.();
      }
    );

    const unsubscribeDismissed = this.appOpenAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        this.isLoaded = false;
        this.callbacks.onAdDismissed?.();
      }
    );

    this.appOpenAd.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeError();
      unsubscribeShowed();
      unsubscribeDismissed();
    };
  }

  show() {
    if (this.appOpenAd && this.isLoaded) {
      this.appOpenAd.show();
    } else {
      console.warn('App open ad not loaded yet');
      this.callbacks.onAdFailedToShow?.(new Error('Ad not loaded'));
    }
  }

  isReady() {
    return this.isLoaded;
  }
}

export const useAppOpenAd = (callbacks?: FullScreenAdCallbacks) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const manager = AppOpenAdManager.getInstance();

  const loadAd = useCallback(() => {
    manager.load(AD_UNIT_IDS.APP_OPEN, {
      ...callbacks,
      onAdLoaded: () => {
        setIsLoaded(true);
        callbacks?.onAdLoaded?.();
      },
      onAdDismissed: () => {
        setIsLoaded(false);
        callbacks?.onAdDismissed?.();
      },
    });
  }, [callbacks, manager]);

  const showAd = useCallback(() => {
    if (isLoaded) {
      manager.show();
      setIsLoaded(false);
    }
  }, [isLoaded, manager]);

  return { isLoaded, loadAd, showAd };
};

// ============================================================================
// AD HOOK - Combined hook for all ad types
// ============================================================================
export const useAds = () => {
  const interstitial = useInterstitialAd();
  const rewarded = useRewardedAd();
  const rewardedInterstitial = useRewardedInterstitialAd();
  const appOpen = useAppOpenAd();

  return {
    interstitial,
    rewarded,
    rewardedInterstitial,
    appOpen,
  };
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  loadingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
});

// Default export
export default {
  BannerAd: BannerAdComponent,
  NativeAd: NativeAdComponent,
  useInterstitialAd,
  useRewardedAd,
  useRewardedInterstitialAd,
  useAppOpenAd,
  useAds,
  requestConsentInfoUpdate,
  getConsentStatus,
  AD_UNIT_IDS,
};
