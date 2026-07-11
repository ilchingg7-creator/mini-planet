export type Locale = 'ru' | 'en';

const messages = {
  ru: {
    logoTop: 'МИНИ-', logoBottom: 'ПЛАНЕТА', level: 'Ур.', create: 'Создать',
    levelComplete: 'ПЛАНЕТА ГОТОВА!', nextLevel: 'Уровень {level}', adBoostShort: 'РЕКЛАМА\nx2',
    adTitle: 'Бонус x2', adDescription: 'Посмотреть рекламу и получать в 2 раза больше монет за объединения в течение 2 минут?',
    watchAd: 'Смотреть', cancel: 'Отмена', tutorialCreate: 'Нажмите «Создать» два раза',
    tutorialMerge: 'Нажмите на два одинаковых предмета, чтобы объединить их', support: 'Поддержка',
    supportEmail: 'seme4kak@yandex.ru', close: 'Закрыть',
  },
  en: {
    logoTop: 'MINI', logoBottom: 'PLANET', level: 'Lvl.', create: 'Create',
    levelComplete: 'PLANET COMPLETE!', nextLevel: 'Level {level}', adBoostShort: 'AD\nx2',
    adTitle: 'x2 bonus', adDescription: 'Watch an ad to earn twice as many coins from merges for 2 minutes?',
    watchAd: 'Watch', cancel: 'Cancel', tutorialCreate: 'Tap Create twice',
    tutorialMerge: 'Tap two identical items to merge them', support: 'Support',
    supportEmail: 'seme4kak@yandex.ru', close: 'Close',
  },
} as const;

export type MessageKey = keyof typeof messages.ru;

export function detectLocale(languages: readonly string[] = []): Locale {
  return languages.some((language) => language.toLowerCase().startsWith('ru')) ? 'ru' : 'en';
}

export function resolveLocale(sdkLocale: string | undefined, languages: readonly string[] = []): Locale {
  if (sdkLocale) return sdkLocale.toLowerCase().startsWith('ru') ? 'ru' : 'en';
  return detectLocale(languages);
}

export function translate(locale: Locale, key: MessageKey, values: Record<string, string | number> = {}): string {
  return Object.entries(values).reduce(
    (message, [name, value]) => message.replace(`{${name}}`, String(value)),
    messages[locale][key] as string,
  );
}
