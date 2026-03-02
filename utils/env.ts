function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const ENV = {
  SBO_URL: required('SBO_URL'),
  SBO_ACCOUNT: required('SBO_ACCOUNT'),
  SBO_PASSWORD: required('SBO_PASSWORD'),
  SBO_AUTH_ACCOUNT: required('SBO_AUTH_ACCOUNT'),
  SBO_AUTH_PASSWORD: required('SBO_AUTH_PASSWORD'),
};