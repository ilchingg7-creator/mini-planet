import { createYandexBridge } from '../../../src/game/systems/yandex';

function createSdkHarness(locale = 'en') {
  let callbacks: {
    onOpen?(): void;
    onRewarded?(): void;
    onClose?(wasShown: boolean): void;
    onError?(error: object): void;
  } = {};
  const ready = vi.fn();
  const cloudData: Record<string, unknown> = {};
  const player = {
    getData: vi.fn(async () => ({ ...cloudData })),
    setData: vi.fn(async (data: Record<string, unknown>, _flush?: boolean) => {
      Object.assign(cloudData, data);
    }),
  };
  const sdkGlobal = {
    init: vi.fn(async () => ({
      environment: { i18n: { lang: locale } },
      features: { LoadingAPI: { ready } },
      adv: { showRewardedVideo: (options: { callbacks: typeof callbacks }) => { callbacks = options.callbacks; } },
      getPlayer: vi.fn(async () => player),
    })),
  };
  return { sdkGlobal, ready, player, cloudData, getCallbacks: () => callbacks };
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

  it('returns null for cloud save when SDK is unavailable', async () => {
    const local = await createYandexBridge({ hostname: 'localhost' });
    await expect(local.loadCloudSave()).resolves.toBeNull();
  });

  it('no-ops cloud write when SDK is unavailable', async () => {
    const local = await createYandexBridge({ hostname: 'localhost' });
    await expect(local.writeCloudSave('{"version":1}')).resolves.toBeUndefined();
  });

  it('reads and writes cloud saves via the Yandex player API', async () => {
    const harness = createSdkHarness();
    const bridge = await createYandexBridge({ hostname: 'yandex.ru', sdkGlobal: harness.sdkGlobal });

    // Initially empty
    expect(await bridge.loadCloudSave()).toBeNull();

    // Write a save
    const raw = '{"version":1,"economy":{"coins":42}}';
    await bridge.writeCloudSave(raw);

    // Verify setData was called with the save under the expected key, flush=true
    expect(harness.player.setData).toHaveBeenCalledWith(
      { 'mini-planet-save': raw },
      true,
    );

    // Read it back
    expect(await bridge.loadCloudSave()).toBe(raw);
    expect(harness.player.getData).toHaveBeenCalled();
  });

  it('returns null when getPlayer throws', async () => {
    const harness = createSdkHarness();
    harness.player.getData.mockRejectedValueOnce(new Error('network'));
    const bridge = await createYandexBridge({ hostname: 'yandex.ru', sdkGlobal: harness.sdkGlobal });
    await expect(bridge.loadCloudSave()).resolves.toBeNull();
  });

  it('swallows write errors without throwing', async () => {
    const harness = createSdkHarness();
    harness.player.setData.mockRejectedValueOnce(new Error('network'));
    const bridge = await createYandexBridge({ hostname: 'yandex.ru', sdkGlobal: harness.sdkGlobal });
    await expect(bridge.writeCloudSave('{"version":1}')).resolves.toBeUndefined();
  });
});
