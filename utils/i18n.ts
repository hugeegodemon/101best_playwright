import fs from 'fs';
import path from 'path';
import type { BrowserContext, Page } from '@playwright/test';

const I18N_DIR = path.resolve(process.cwd(), 'i18n');
const DEFAULT_LOCALE = 'en-us';
const LOCALE_FILE_PATTERN = /^[a-z]{2,3}-[a-z]{2}\.json$/i;

export const BO_LANGUAGE_STORAGE_KEY = 'language';

type I18nNamespace = 'error_code' | 'backend' | 'frontend';

type I18nDictionary = Record<I18nNamespace, Record<string, string>>;

const dictionaryCache = new Map<string, I18nDictionary>();

function getAvailableLocales(): Set<string> {
  const locales = fs
    .readdirSync(I18N_DIR)
    .filter((fileName) => LOCALE_FILE_PATTERN.test(fileName))
    .map((fileName) => fileName.replace(/\.json$/i, '').toLowerCase());

  return new Set(locales);
}

function normalizeLocale(locale?: string | null): string {
  const candidate = locale?.trim().toLowerCase();

  if (!candidate) {
    return DEFAULT_LOCALE;
  }

  return getAvailableLocales().has(candidate) ? candidate : DEFAULT_LOCALE;
}

function loadDictionary(locale: string): I18nDictionary {
  const normalizedLocale = normalizeLocale(locale);
  const cached = dictionaryCache.get(normalizedLocale);

  if (cached) {
    return cached;
  }

  const filePath = path.join(I18N_DIR, `${normalizedLocale}.json`);
  const dictionary = JSON.parse(fs.readFileSync(filePath, 'utf8')) as I18nDictionary;

  dictionaryCache.set(normalizedLocale, dictionary);

  return dictionary;
}

export async function useLocaleInContext(
  context: BrowserContext,
  locale?: string | null
): Promise<void> {
  if (!locale?.trim()) {
    return;
  }

  const normalizedLocale = normalizeLocale(locale);

  await context.addInitScript(
    ({ storageKey, storageValue }) => {
      window.localStorage.setItem(storageKey, storageValue);
    },
    {
      storageKey: BO_LANGUAGE_STORAGE_KEY,
      storageValue: normalizedLocale,
    }
  );
}

export async function getCurrentLocale(page: Page): Promise<string> {
  try {
    const locale = await page.evaluate((storageKey) => {
      return window.localStorage.getItem(storageKey);
    }, BO_LANGUAGE_STORAGE_KEY);

    return normalizeLocale(locale);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export class BOI18n {
  private locale?: string;

  constructor(private readonly page: Page) {}

  async getLocale(): Promise<string> {
    if (!this.locale) {
      this.locale = await getCurrentLocale(this.page);
    }

    return this.locale;
  }

  async t(key: string, namespace: I18nNamespace = 'backend'): Promise<string> {
    const locale = await this.getLocale();
    const dictionary = loadDictionary(locale);

    if (namespace === 'error_code') {
      return dictionary.error_code[key] ?? key;
    }

    return dictionary[namespace][key] ?? key;
  }

  async error(code: string): Promise<string> {
    const message = await this.t(code, 'error_code');
    return `${code} ${message}`.trim();
  }
}
