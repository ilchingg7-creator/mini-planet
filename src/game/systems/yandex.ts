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

async function loadYandexSdk(timeoutMs = 8000): Promise<YaGamesGlobal | undefined> {
  if (typeof document === 'undefined') return undefined;
  // Race the SDK load against a timeout. Yandex's CDN is occasionally slow,
  // and without a cap BootScene.create() would await forever on the script
  // onload — leaving the user staring at a blank blue screen with no UI.
  // On timeout we resolve to undefined and let the bridge fall back to the
  // no-SDK path so the game still starts (without Yandex features).
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/sdk.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Yandex Games SDK failed to load'));
      // Defensive cap: even if the script element never fires onload/onerror
      // (e.g. CSP blocks it silently, network stalls), resolve so the game
      // can proceed. We resolve (not reject) because the catch below falls
      // back to undefined SDK anyway — same outcome either way.
      timer = setTimeout(() => resolve(), timeoutMs);
      document.head.append(script);
    });
    return window.YaGames;
  } finally {
    if (timer) clearTimeout(timer);
  }
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
