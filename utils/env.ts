function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requiredAny(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required environment variable: ${names.join(' or ')}`);
}

export const ENV = {
  SBO_URL: required('SBO_URL'),
  SBO_ACCOUNT: required('SBO_ACCOUNT'),
  SBO_PASSWORD: required('SBO_PASSWORD'),
  SBO_AUTH_ACCOUNT: required('SBO_AUTH_ACCOUNT'),
  SBO_AUTH_PASSWORD: required('SBO_AUTH_PASSWORD'),
  SBO_SMOKE_ACCOUNT: requiredAny('SBO_SMOKE_ACCOUNT', 'SBO_ACCOUNT'),
  SBO_SMOKE_PASSWORD: requiredAny('SBO_SMOKE_PASSWORD', 'SBO_PASSWORD'),
  SBO_MANAGED_SITE: required('SBO_MANAGED_SITE'),
  SBO_LANGUAGE_VALIDATION_SITE: requiredAny('SBO_LANGUAGE_VALIDATION_SITE', 'SBO_MANAGED_SITE'),
  SBO_LOCALE: process.env.SBO_LOCALE,
};
