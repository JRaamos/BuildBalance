import { spawnSync } from 'node:child_process';
import { normalizeDatabaseUrl, requireDatabaseUrl } from '../src/common/database-url';

const commandArguments = process.argv.slice(2);
if (!commandArguments.length) {
  throw new Error('Informe o comando Prisma que deve ser executado.');
}

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const databaseUrl =
  commandArguments[0] === 'generate' && !normalizeDatabaseUrl(process.env.DATABASE_URL)
    ? 'postgresql://generate:generate@localhost:5432/generate'
    : requireDatabaseUrl();

const result = spawnSync(command, ['--no-install', 'prisma', ...commandArguments], {
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl
  },
  stdio: 'inherit'
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
