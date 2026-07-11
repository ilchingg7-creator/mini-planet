import { detectLocale, resolveLocale, translate } from '../../src/game/i18n';

describe('localization', () => {
  it('selects Russian when any browser language is Russian', () => {
    expect(detectLocale(['en-US', 'ru-RU'])).toBe('ru');
  });

  it('uses English for non-Russian and missing browser languages', () => {
    expect(detectLocale(['de-DE'])).toBe('en');
    expect(detectLocale()).toBe('en');
  });

  it('interpolates localized values', () => {
    expect(translate('en', 'nextLevel', { level: 2 })).toBe('Level 2');
  });

  it('prefers the Yandex SDK locale over browser languages', () => {
    expect(resolveLocale('en', ['ru-RU'])).toBe('en');
    expect(resolveLocale('ru', ['en-US'])).toBe('ru');
  });
});
