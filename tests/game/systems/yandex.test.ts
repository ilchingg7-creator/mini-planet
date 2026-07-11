import { createYandexBridge } from '../../../src/game/systems/yandex';

function createSdkHarness(locale = 'en') {
  let callbacks: {
    onOpen?(): void;
    onRewarded?(): void;
    onClose?(wasShown: boolean): void;
    onError?(error: object): void;
  } = {};
  const ready = vi.fn();
  const sdkGlobal = {
    init: vi.fn(async () => ({
      environment: { i18n: { lang: locale } },
      features: { LoadingAPI: { ready } },
      adv: { showRewardedVideo: (options: { callbacks: typeof callbacks }) => { callbacks = options.callbacks; } },
    })),
  };
  return { sdkGlobal, ready, getCallbacks: () => callbacks };
}

describe('Yandex bridge', () => {
  it('initializes the SDK, exposes its locale, and reports game ready', async () => {
    const harness = createSdkHarness('ru');
    const bridge = await createYandexBridge({ hostname: 'yandex.ru', sdkGlobal: harness.sdkGlobal });
    await bridge.markReady();

    expect(bridge.isAvailable).toBe(true);
    expect(bridge.locale).toBe('ru');
    expect(harness.ready).toHaveBeenCalledOnce();
  });

  it('grants a rewarded result only after onRewarded and close', async () => {
    const harness = createSdkHarness();
    const bridge = await createYandexBridge({ hostname: 'yandex.ru', sdkGlobal: harness.sdkGlobal });
    const result = bridge.showRewardedAd('mergeBoost');
    harness.getCallbacks().onRewarded?.();
    harness.getCallbacks().onClose?.(true);
    await expect(result).resolves.toBe(true);
  });

  it('does not grant rewards on close or errors', async () => {
    const closedHarness = createSdkHarness();
    const closedBridge = await createYandexBridge({ hostname: 'yandex.ru', sdkGlobal: closedHarness.sdkGlobal });
    const closedResult = closedBridge.showRewardedAd('mergeBoost');
    closedHarness.getCallbacks().onClose?.(true);
    await expect(closedResult).resolves.toBe(false);

    const errorHarness = createSdkHarness();
    const errorBridge = await createYandexBridge({ hostname: 'yandex.ru', sdkGlobal: errorHarness.sdkGlobal });
    const errorResult = errorBridge.showRewardedAd('mergeBoost');
    errorHarness.getCallbacks().onError?.({});
    await expect(errorResult).resolves.toBe(false);
  });

  it('uses reward simulation only on localhost', async () => {
    const local = await createYandexBridge({ hostname: 'localhost' });
    const production = await createYandexBridge({ hostname: 'example.com' });
    await expect(local.showRewardedAd('mergeBoost')).resolves.toBe(true);
    await expect(production.showRewardedAd('mergeBoost')).resolves.toBe(false);
  });
});
