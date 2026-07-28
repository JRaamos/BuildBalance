const SUPPORTED_DATABASE_PROTOCOL = /^postgres(?:ql)?:\/\//;

export function normalizeDatabaseUrl(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();
  if (!trimmedValue) return undefined;

  const firstCharacter = trimmedValue.at(0);
  const lastCharacter = trimmedValue.at(-1);
  const hasMatchingQuotes =
    (firstCharacter === '"' || firstCharacter === "'") &&
    firstCharacter === lastCharacter;

  return (hasMatchingQuotes ? trimmedValue.slice(1, -1) : trimmedValue).trim();
}

export function requireDatabaseUrl(value = process.env.DATABASE_URL): string {
  const normalizedValue = normalizeDatabaseUrl(value);

  if (!normalizedValue) {
    throw new Error('DATABASE_URL não foi configurada.');
  }

  if (!SUPPORTED_DATABASE_PROTOCOL.test(normalizedValue)) {
    throw new Error('DATABASE_URL deve começar com postgresql:// ou postgres://.');
  }

  return normalizedValue;
}
