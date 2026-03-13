let uniqueCounter = 0;

function nextUniqueSeed(): string {
  uniqueCounter += 1;
  return `${Date.now().toString(36)}${uniqueCounter.toString(36).padStart(2, '0')}`;
}

function uniqueToken(length: number, alphabet: string): string {
  let value = BigInt(Date.now()) * 1000n + BigInt(uniqueCounter += 1);
  const base = BigInt(alphabet.length);
  let token = '';

  for (let index = 0; index < length; index += 1) {
    token = `${alphabet[Number(value % base)]}${token}`;
    value = value / base + BigInt(index + 1);
  }

  return token;
}

export function uniqueSeed(): string {
  return nextUniqueSeed();
}

export function uniqueDigits(length = 6): string {
  return uniqueToken(length, '0123456789');
}

export function uniqueAlpha(length = 5): string {
  return uniqueToken(length, 'abcdefghijklmnopqrstuvwxyz');
}

export function uniqueUpperAlnum(length = 6): string {
  return uniqueToken(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
}

export function buildMissValue(prefix: string, length = 8): string {
  return `${prefix}_${uniqueUpperAlnum(length)}`;
}

export function buildAdminData(seed: string = uniqueSeed()) {
  return {
    account: `auto${seed}`,
    name: 'AutoAdmin',
    password: 'Test12345',
    email: `autoadmin${seed}@test.com`,
  };
}

export function buildOperatorData(seed: string = uniqueSeed()) {
  return {
    account: `op${seed}`,
    name: 'AutoOperator',
    password: 'Test12345',
    email: `operator${seed}@test.com`,
  };
}

export function buildRoleName(prefix = 'AutoRole'): string {
  return `${prefix}${uniqueAlpha(5)}`;
}

export function buildSiteDraft(prefix: string) {
  const suffix = uniqueDigits(8);
  const tag = prefix.toLowerCase();

  return {
    suffix,
    siteName: `${prefix}${suffix}`,
    hiddenCode: `HC${suffix.slice(-6)}`,
    frontendUrl: `www.${tag}${suffix}-front.com`,
    backendUrl: `www.${tag}${suffix}-back.com`,
  };
}

export function buildGameDraft(prefix = 'AUTOGP') {
  const suffix = uniqueDigits(6);
  const gameName = `${prefix}${suffix}`;

  return {
    suffix,
    gameName,
    editedGameName: `${gameName}E`,
    code: `T${uniqueUpperAlnum(3)}`,
  };
}

export function buildSystemBankDraft(codePrefix = 'AT', namePrefix = 'AUTO BANK') {
  const suffix = uniqueUpperAlnum(8);

  return {
    suffix,
    bankCode: `${codePrefix}${suffix}`,
    bankName: `${namePrefix} ${suffix}`,
  };
}

function formatDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join(' ');
}

export function dateTimeOffset(minutes: number): string {
  return formatDateTime(new Date(Date.now() + minutes * 60 * 1000));
}

export function buildCarouselLinkDraft(prefix = 'carousel') {
  const suffix = uniqueDigits(10);

  return {
    suffix,
    url: `example.com/${prefix}-${suffix}`,
    editedUrl: `example.com/${prefix}-edited-${suffix}`,
  };
}
