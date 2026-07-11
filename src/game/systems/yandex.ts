export type RewardPlacement = 'mergeBoost' | 'betterItem';

export interface AdLifecycle {
  onOpen?(): void;
  onClose?(): void;
}

interface YandexSdk {
  environment?: { i18n?: { lang?: string } };
  features?: { LoadingAPI?: { ready(): Promise<void> | void } };
  adv: {
    showRewardedVideo(options: {
      callbacks: {
        onOpen?(): void;
        onRewarded?(): void;
        onClose?(wasShown: boolean): void;
        onError?(error: object): void;
      };
    }): void;
  };
}

interface YaGamesGlobal {
  init(): Promise<YandexSdk>;
}

declare global {
  interface Window {
    YaGames?: YaGamesGlobal;
  }
}

export interface YandexBridge {
  isAvailable: boolean;
  locale?: string;
  markReady(): Promise<void>;
  showRewardedAd(placement: RewardPlacement, lifecycle?: AdLifecycle): Promise<boolean>;
}

export interface YandexBridgeOptions {
  hostname?: string;
  sdkGlobal?: YaGamesGlobal;
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

async function loadYandexSdk(): Promise<YaGamesGlobal | undefined> {
  if (typeof document === 'undefined') return undefined;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/sdk.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Yandex Games SDK failed to load'));
    document.head.append(script);
  });
  return window.YaGames;
}

export async function createYandexBridge(options: YandexBridgeOptions = {}): Promise<YandexBridge> {
  const browserWindow = typeof window === 'undefined' ? undefined : window;
  const hostname = options.hostname ?? browserWindow?.location.hostname ?? '';
  let sdkGlobal = 'sdkGlobal' in options ? options.sdkGlobal : browserWindow?.YaGames;

  if (!sdkGlobal && !isLocalHost(hostname) && !('sdkGlobal' in options)) {
    try {
      sdkGlobal = await loadYandexSdk();
    } catch {
      sdkGlobal = undefined;
    }
  }

  if (!sdkGlobal) {
    const local = isLocalHost(hostname);
    return {
      isAvailable: false,
      markReady: async () => undefined,
      showRewardedAd: async (_placement, lifecycle) => {
        if (!local) return false;
        lifecycle?.onOpen?.();
        lifecycle?.onClose?.();
        return true;
      },
    };
  }

  try {
    const sdk = await sdkGlobal.init();
    return {
      isAvailable: true,
      locale: sdk.environment?.i18n?.lang,
      markReady: async () => {
        await sdk.features?.LoadingAPI?.ready();
      },
      showRewardedAd: (_placement, lifecycle) => new Promise((resolve) => {
        let rewarded = false;
        let settled = false;
        const finish = (result: boolean) => {
          if (settled) return;
          settled = true;
          lifecycle?.onClose?.();
          resolve(result);
        };

        sdk.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => lifecycle?.onOpen?.(),
            onRewarded: () => { rewarded = true; },
            onClose: () => finish(rewarded),
            onError: () => finish(false),
          },
        });
      }),
    };
  } catch {
    return {
      isAvailable: false,
      markReady: async () => undefined,
      showRewardedAd: async () => false,
    };
  }
}
