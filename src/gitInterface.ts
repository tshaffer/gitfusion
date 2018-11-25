import * as shell from 'shelljs';

import {
  LocalBranch,
  LocalBranches,
} from './gitInterfaces';

export function shellInit() {
  shell.config.execPath = shell.which('node')
}

export function cd(dirName: string) {
  shell.cd(dirName);
}

export function gitStatus(): string {
  return shell.exec('git status').stdout;
}

export function gitFetch(): string {
  return shell.exec('git fetch').stdout;
}

export function gitLog(): string {
  return shell.exec('git log -1').stdout;
}

export function gitBranch(options: string): string {
  const results = shell.exec('git branch' + options);
  return results.stdout;
}

export function getLocalBranches(): LocalBranches {

  const branchResults = gitBranch('');

  const localBranches: LocalBranches = {
    branches: [],
    currentBranch: null
  };

  const branchResultEntities: string[] = branchResults.split('\n');
  branchResultEntities.forEach( (branchResultEntity: string) => {
    let localBranch: LocalBranch;
    if (branchResultEntity.startsWith('*')) {
      localBranch = {
        name: branchResultEntity.substring(2)
      }
      localBranches.currentBranch = localBranch;
      localBranches.branches.push(localBranch);
    }
    else {
      const trimmedBranchName = branchResultEntity.trim();
      if (trimmedBranchName.length > 0) {
        localBranch = {
          name: trimmedBranchName
        }
        localBranches.branches.push(localBranch);
      }
    }
  });

  return localBranches;
}
