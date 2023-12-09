#!/usr/bin/env node
import cac from 'cac';
import { version } from '../package.json';
import { cleanup, genChangelog, gitCommit, gitCommitVerify, ncu, release } from './command';
import { loadCliOptions } from './config';
import type { CliOption } from './types';

type Command = 'cleanup' | 'ncu' | 'git-commit' | 'git-commit-verify' | 'changelog' | 'release';

type CommandAction<A extends object> = (args?: A) => Promise<void> | void;

type CommandWithAction<A extends object = object> = Record<Command, { desc: string; action: CommandAction<A> }>;

interface CommandArg {
  /** Execute additional command after bumping and before git commit. Defaults to 'npx soy changelog' */
  execute?: string;
  /** Indicates whether to push the git commit and tag. Defaults to true */
  push?: boolean;
  /** Generate changelog by total tags */
  total?: boolean;
}

async function setupCli() {
  const cliOptions = await loadCliOptions();

  const cli = cac('soybean');

  cli
    .version(version)
    .option(
      '--execute [command]',
      "Execute additional command after bumping and before git commit. Defaults to 'npx soy changelog'"
    )
    .option('--push', 'Indicates whether to push the git commit and tag')
    .option('--total', 'Generate changelog by total tags')
    .help();

  const commands: CommandWithAction<CommandArg> = {
    cleanup: {
      desc: 'delete dirs: node_modules, dist, etc.',
      action: async () => {
        await cleanup(cliOptions.cleanupDirs);
      }
    },
    ncu: {
      desc: 'npm-check-updates, it can update package.json dependencies to the latest version',
      action: async () => {
        await ncu(cliOptions.ncuCommandArgs);
      }
    },
    'git-commit': {
      desc: 'git commit, generate commit message which match Conventional Commits standard',
      action: async () => {
        await gitCommit(cliOptions.gitCommitTypes, cliOptions.gitCommitScopes);
      }
    },
    'git-commit-verify': {
      desc: 'verify git commit message, make sure it match Conventional Commits standard',
      action: async () => {
        await gitCommitVerify();
      }
    },
    changelog: {
      desc: 'generate changelog',
      action: async args => {
        await genChangelog(cliOptions.changelogOptions, args?.total);
      }
    },
    release: {
      desc: 'release: update version, generate changelog, commit code',
      action: async args => {
        await release(args?.execute, args?.push);
      }
    }
  };

  for await (const [command, { desc, action }] of Object.entries(commands)) {
    cli.command(command, desc).action(action);
  }

  cli.parse();
}

setupCli();

export function defineConfig(config?: Partial<CliOption>) {
  return config;
}

export type { CliOption };
