import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { loadConfig } from 'c12';
import { Crypto } from '../shared';
import type { CliOption } from '../types';

const eslintExt = '*.{js,jsx,mjs,cjs,json,ts,tsx,mts,cts,vue,svelte,astro}';

const defaultOptions: CliOption = {
  cwd: process.cwd(),
  cleanupDirs: [
    '**/dist',
    '**/package-lock.json',
    '**/yarn.lock',
    '**/pnpm-lock.yaml',
    '**/node_modules',
    '!node_modules/**'
  ],
  gitCommitTypes: [
    ['feat', 'A new feature'],
    ['fix', 'A bug fix'],
    ['docs', 'Documentation only changes'],
    ['style', 'Changes that do not affect the meaning of the code'],
    ['refactor', 'A code change that neither fixes a bug nor adds a feature'],
    ['perf', 'A code change that improves performance'],
    ['test', 'Adding missing tests or correcting existing tests'],
    ['build', 'Changes that affect the build system or external dependencies'],
    ['ci', 'Changes to our CI configuration files and scripts'],
    ['chore', "Other changes that don't modify src or test files"],
    ['revert', 'Reverts a previous commit']
  ],
  gitCommitScopes: [
    ['projects', 'project'],
    ['components', 'components'],
    ['hooks', 'hook functions'],
    ['utils', 'utils functions'],
    ['types', 'TS declaration'],
    ['styles', 'style'],
    ['deps', 'project dependencies'],
    ['release', 'release project'],
    ['other', 'other changes']
  ],
  ncuCommandArgs: ['--deep', '-u'],
  changelogOptions: {},
  prettierWriteGlob: [
    `!**/${eslintExt}`,
    '!*.min.*',
    '!CHANGELOG.md',
    '!dist',
    '!LICENSE*',
    '!output',
    '!coverage',
    '!public',
    '!temp',
    '!package-lock.json',
    '!pnpm-lock.yaml',
    '!yarn.lock',
    '!.github',
    '!__snapshots__',
    '!node_modules'
  ],
  lintStagedConfig: {
    [eslintExt]: 'eslint --fix',
    '*': 'soy prettier-write'
  }
};

const SOYBEAN_GT = 'U2FsdGVkX18dc7x8PmAq30sl+nyGmi5VJJwninmYBRs8vVILEIjY+kT/F8ajm/6gRTMbDAEmx5WKInQBzeNSig==';

export async function loadCliOptions(overrides?: Partial<CliOption>, cwd = process.cwd()) {
  const { config } = await loadConfig<Partial<CliOption>>({
    name: 'soybean',
    defaults: defaultOptions,
    overrides,
    cwd,
    packageJson: true
  });

  const has = await hasSoybeanInfoFromPkgJson(cwd);

  if (config && has) {
    const crypto = new Crypto<string>('SOYBEAN_JS');

    config.changelogOptions = {
      ...config.changelogOptions,
      github: { repo: '', token: crypto.deCrypto(SOYBEAN_GT) || '' }
    };
  }

  return config as CliOption;
}

async function hasSoybeanInfoFromPkgJson(cwd: string) {
  let hasSoybeanInfo = false;

  const reg = 'soybean';

  try {
    const pkgJson = await readFile(`${cwd}/package.json`, 'utf-8');
    const pkg = JSON.parse(pkgJson);
    hasSoybeanInfo =
      pkg.name?.includes(reg) ||
      pkg.repository?.url?.includes(reg) ||
      pkg.author?.includes(reg) ||
      pkg.author?.name?.includes(reg) ||
      pkg.author?.url?.includes(reg);
  } catch {}

  return hasSoybeanInfo;
}
